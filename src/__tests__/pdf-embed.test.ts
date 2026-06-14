import {
	PDFArray,
	PDFDict,
	PDFDocument,
	PDFName,
	PDFStream,
	PDFString,
} from "pdf-lib";
import { describe, expect, it } from "vitest";
import { embedZugferdXml } from "../pdf/embed";
import { buildZugferdXmpMetadata } from "../pdf/xmp";

async function createTestPdf(): Promise<Uint8Array> {
	const doc = await PDFDocument.create();
	doc.addPage([595, 842]);
	return doc.save();
}

const sampleXml = `<?xml version="1.0" encoding="UTF-8"?><Invoice><ID>TEST-001</ID></Invoice>`;

function findFilespecInAF(doc: PDFDocument): PDFDict | undefined {
	const catalog = doc.catalog;
	const afArray = catalog.lookupMaybe(PDFName.of("AF"), PDFArray);
	if (!afArray) return undefined;
	for (let i = 0; i < afArray.size(); i++) {
		const entry = afArray.lookup(i);
		if (entry instanceof PDFDict) {
			return entry;
		}
	}
	return undefined;
}

describe("embedZugferdXml", () => {
	it("output is a valid PDF", async () => {
		const pdfBuffer = await createTestPdf();
		const result = await embedZugferdXml(pdfBuffer, sampleXml);
		const decoded = new TextDecoder().decode(result.slice(0, 5));
		expect(decoded).toBe("%PDF-");
		await expect(PDFDocument.load(result)).resolves.toBeDefined();
	});

	it("output contains an embedded file named factur-x.xml", async () => {
		const pdfBuffer = await createTestPdf();
		const result = await embedZugferdXml(pdfBuffer, sampleXml);
		const doc = await PDFDocument.load(result);
		const filespec = findFilespecInAF(doc);
		expect(filespec).toBeDefined();
		const f = filespec?.get(PDFName.of("F"));
		const uf = filespec?.get(PDFName.of("UF"));
		const hasFilename =
			(f instanceof PDFString && f.decodeText() === "factur-x.xml") ||
			(uf instanceof PDFString && uf.decodeText() === "factur-x.xml");
		expect(hasFilename).toBe(true);
	});

	it("embedded XML content matches input", async () => {
		const pdfBuffer = await createTestPdf();
		const result = await embedZugferdXml(pdfBuffer, sampleXml);
		const doc = await PDFDocument.load(result);
		const filespec = findFilespecInAF(doc);
		expect(filespec).toBeDefined();
		const ef = filespec?.lookup(PDFName.of("EF"));
		expect(ef).toBeInstanceOf(PDFDict);
		const stream = (ef as PDFDict).lookup(PDFName.of("F"));
		expect(stream).toBeInstanceOf(PDFStream);
		const content = new TextDecoder().decode(
			(stream as PDFStream).getContents(),
		);
		expect(content).toBe(sampleXml);
	});

	it("XMP metadata contains ConformanceLevel = EXTENDED", async () => {
		const pdfBuffer = await createTestPdf();
		const result = await embedZugferdXml(pdfBuffer, sampleXml);
		const doc = await PDFDocument.load(result);
		const metadataStream = doc.catalog.lookup(PDFName.of("Metadata"));
		expect(metadataStream).toBeInstanceOf(PDFStream);
		const xmp = new TextDecoder().decode(
			(metadataStream as PDFStream).getContents(),
		);
		expect(xmp).toContain(
			"<fx:ConformanceLevel>EXTENDED</fx:ConformanceLevel>",
		);
	});

	it("XMP contains PDF/A-3 declaration", async () => {
		const pdfBuffer = await createTestPdf();
		const result = await embedZugferdXml(pdfBuffer, sampleXml);
		const doc = await PDFDocument.load(result);
		const metadataStream = doc.catalog.lookup(PDFName.of("Metadata"));
		expect(metadataStream).toBeInstanceOf(PDFStream);
		const xmp = new TextDecoder().decode(
			(metadataStream as PDFStream).getContents(),
		);
		expect(xmp).toContain("<pdfaid:part>3</pdfaid:part>");
		expect(xmp).toContain("<pdfaid:conformance>B</pdfaid:conformance>");
	});

	it("AFRelationship is Alternative", async () => {
		const pdfBuffer = await createTestPdf();
		const result = await embedZugferdXml(pdfBuffer, sampleXml);
		const doc = await PDFDocument.load(result);
		const filespec = findFilespecInAF(doc);
		expect(filespec).toBeDefined();
		const rel = filespec?.get(PDFName.of("AFRelationship"));
		expect(rel).toBeInstanceOf(PDFName);
		expect((rel as PDFName).asString()).toBe("/Alternative");
	});

	it("handles large XML (100KB)", async () => {
		const pdfBuffer = await createTestPdf();
		const element = "<Item>x</Item>";
		const largeXml = element.repeat(Math.ceil(100_000 / element.length));
		const result = await embedZugferdXml(pdfBuffer, largeXml);
		expect(result.length).toBeGreaterThan(pdfBuffer.length + 100_000);
		const doc = await PDFDocument.load(result);
		const filespec = findFilespecInAF(doc);
		expect(filespec).toBeDefined();
		const ef = filespec?.lookup(PDFName.of("EF"));
		const stream = (ef as PDFDict).lookup(PDFName.of("F"));
		const content = new TextDecoder().decode(
			(stream as PDFStream).getContents(),
		);
		expect(content).toBe(largeXml);
	});

	it("handles existing PDF with text content", async () => {
		const doc = await PDFDocument.create();
		const page = doc.addPage([595, 842]);
		const font = await doc.embedFont("Helvetica");
		page.drawText("Test invoice content", { x: 50, y: 750, size: 12, font });
		const pdfWithText = await doc.save();

		const result = await embedZugferdXml(pdfWithText, sampleXml);
		const resultDoc = await PDFDocument.load(result);
		expect(resultDoc.getPageCount()).toBe(1);

		const filespec = findFilespecInAF(resultDoc);
		expect(filespec).toBeDefined();
		const f = filespec?.get(PDFName.of("F"));
		expect(f).toBeInstanceOf(PDFString);
		expect((f as PDFString).decodeText()).toBe("factur-x.xml");
	});

	it("buildZugferdXmpMetadata returns correct structure", () => {
		const xmp = buildZugferdXmpMetadata("EXTENDED");
		expect(xmp).toContain(
			"<fx:ConformanceLevel>EXTENDED</fx:ConformanceLevel>",
		);
		expect(xmp).toContain("<pdfaid:part>3</pdfaid:part>");
		expect(xmp).toContain("<pdfaid:conformance>B</pdfaid:conformance>");
		expect(xmp).toContain("<?xpacket");
	});
});
