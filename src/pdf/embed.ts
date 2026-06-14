import { PDFArray, PDFDict, PDFDocument, PDFName, PDFString } from "pdf-lib";
import { buildZugferdXmpMetadata } from "./xmp";

export async function embedZugferdXml(
	pdfBuffer: Uint8Array,
	xmlString: string,
): Promise<Uint8Array> {
	const doc = await PDFDocument.load(pdfBuffer);
	const context = doc.context;

	const xmlBytes = new TextEncoder().encode(xmlString);

	const embeddedFileStream = context.stream(xmlBytes, {
		Type: "EmbeddedFile",
		Subtype: "text#2Fxml",
	});
	const embeddedFileStreamRef = context.register(embeddedFileStream);

	const filespecDict = context.obj({
		Type: "Filespec",
		F: PDFString.of("factur-x.xml"),
		UF: PDFString.of("factur-x.xml"),
		AFRelationship: PDFName.of("Alternative"),
		EF: context.obj({ F: embeddedFileStreamRef }),
	});
	const filespecRef = context.register(filespecDict);

	const catalog = doc.catalog;
	const existingAF = catalog.lookupMaybe(PDFName.of("AF"), PDFArray);
	if (existingAF) {
		existingAF.push(filespecRef);
	} else {
		catalog.set(PDFName.of("AF"), context.obj([filespecRef]));
	}

	const namesDictRef = catalog.lookupMaybe(PDFName.of("Names"), PDFDict);
	if (namesDictRef) {
		const embeddedFilesArray = context.obj([
			PDFString.of("factur-x.xml"),
			filespecRef,
		]);
		namesDictRef.set(
			PDFName.of("EmbeddedFiles"),
			context.obj({
				Names: embeddedFilesArray,
			}),
		);
	} else {
		const embeddedFilesDict = context.obj({
			Names: context.obj([PDFString.of("factur-x.xml"), filespecRef]),
		});
		const namesDict = context.obj({ EmbeddedFiles: embeddedFilesDict });
		catalog.set(PDFName.of("Names"), namesDict);
	}

	const xmpString = buildZugferdXmpMetadata("EXTENDED");
	const xmpBytes = new TextEncoder().encode(xmpString);
	const metadataStream = context.stream(xmpBytes, {
		Type: "Metadata",
		Subtype: "XML",
	});
	const metadataStreamRef = context.register(metadataStream);
	catalog.set(PDFName.of("Metadata"), metadataStreamRef);

	return doc.save();
}
