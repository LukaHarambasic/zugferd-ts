function writeUint32BE(buf: Uint8Array, offset: number, value: number): void {
	buf[offset] = (value >>> 24) & 0xff;
	buf[offset + 1] = (value >>> 16) & 0xff;
	buf[offset + 2] = (value >>> 8) & 0xff;
	buf[offset + 3] = value & 0xff;
}

function writeUint16BE(buf: Uint8Array, offset: number, value: number): void {
	buf[offset] = (value >>> 8) & 0xff;
	buf[offset + 1] = value & 0xff;
}

function writeAscii(buf: Uint8Array, offset: number, str: string): void {
	for (let i = 0; i < str.length; i++) {
		buf[offset + i] = str.charCodeAt(i);
	}
}

function writeS15Fixed16BE(
	buf: Uint8Array,
	offset: number,
	value: number,
): void {
	const int = Math.round(value * 65536);
	writeUint32BE(buf, offset, int >>> 0);
}

export function buildMinimalSrgbIccProfile(): Uint8Array {
	const descText = "sRGB IEC61966-2.1";
	const descPadded = descText.padEnd(68, "\0");

	const descTagSize = 8 + 4 + 1 + descPadded.length;
	const wtptTagSize = 20;
	const rXYZTagSize = 20;
	const gXYZTagSize = 20;
	const bXYZTagSize = 20;
	const rTRCTagSize = 14;
	const gTRCTagSize = 14;
	const bTRCTagSize = 14;

	const numTags = 8;
	const headerSize = 128;
	const tagTableSize = 4 + numTags * 12;

	let offset = headerSize + tagTableSize;
	const descOffset = offset;
	offset += descTagSize + ((4 - (descTagSize % 4)) % 4);
	const wtptOffset = offset;
	offset += wtptTagSize;
	const rXYZOffset = offset;
	offset += rXYZTagSize;
	const gXYZOffset = offset;
	offset += gXYZTagSize;
	const bXYZOffset = offset;
	offset += bXYZTagSize;
	const rTRCOffset = offset;
	offset += rTRCTagSize;
	const gTRCOffset = offset;
	offset += gTRCTagSize;
	const bTRCOffset = offset;
	offset += bTRCTagSize;

	const profileSize = offset;
	const buf = new Uint8Array(profileSize);

	writeUint32BE(buf, 0, profileSize);
	writeAscii(buf, 4, "none");
	writeUint32BE(buf, 8, 0x02100000);
	writeAscii(buf, 12, "mntr");
	writeAscii(buf, 16, "RGB ");
	writeAscii(buf, 20, "XYZ ");
	writeUint32BE(buf, 24, 2026);
	writeUint16BE(buf, 28, 5);
	writeUint16BE(buf, 30, 31);
	writeUint16BE(buf, 32, 12);
	writeUint16BE(buf, 34, 0);
	writeUint16BE(buf, 36, 0);
	writeAscii(buf, 40, "acsp");
	writeAscii(buf, 44, "    ");
	writeAscii(buf, 48, "    ");
	writeUint32BE(buf, 64, 0x0000f6d6);
	writeUint32BE(buf, 68, 0x00010000);
	writeUint32BE(buf, 72, 0x0000d32d);
	writeAscii(buf, 80, "Google  ");
	writeAscii(buf, 88, "Minimal sRGB ");

	writeUint32BE(buf, 128, numTags);

	const tags: Array<[string, number, number]> = [
		["desc", descOffset, descTagSize],
		["wtpt", wtptOffset, wtptTagSize],
		["rXYZ", rXYZOffset, rXYZTagSize],
		["gXYZ", gXYZOffset, gXYZTagSize],
		["bXYZ", bXYZOffset, bXYZTagSize],
		["rTRC", rTRCOffset, rTRCTagSize],
		["gTRC", gTRCOffset, gTRCTagSize],
		["bTRC", bTRCOffset, bTRCTagSize],
	];

	let tagTablePos = 132;
	for (const [sig, tagOffset, size] of tags) {
		writeAscii(buf, tagTablePos, sig);
		writeUint32BE(buf, tagTablePos + 4, tagOffset);
		writeUint32BE(buf, tagTablePos + 8, size);
		tagTablePos += 12;
	}

	writeAscii(buf, descOffset, "desc");
	writeUint32BE(buf, descOffset + 8, descText.length + 1);
	writeAscii(buf, descOffset + 12, descText);

	writeAscii(buf, wtptOffset, "XYZ ");
	writeS15Fixed16BE(buf, wtptOffset + 8, 0.95047);
	writeS15Fixed16BE(buf, wtptOffset + 12, 1.0);
	writeS15Fixed16BE(buf, wtptOffset + 16, 1.08883);

	writeAscii(buf, rXYZOffset, "XYZ ");
	writeS15Fixed16BE(buf, rXYZOffset + 8, 0.4360747);
	writeS15Fixed16BE(buf, rXYZOffset + 12, 0.2224845);
	writeS15Fixed16BE(buf, rXYZOffset + 16, 0.0139322);

	writeAscii(buf, gXYZOffset, "XYZ ");
	writeS15Fixed16BE(buf, gXYZOffset + 8, 0.3850649);
	writeS15Fixed16BE(buf, gXYZOffset + 12, 0.7169051);
	writeS15Fixed16BE(buf, gXYZOffset + 16, 0.0971045);

	writeAscii(buf, bXYZOffset, "XYZ ");
	writeS15Fixed16BE(buf, bXYZOffset + 8, 0.1430804);
	writeS15Fixed16BE(buf, bXYZOffset + 12, 0.0606104);
	writeS15Fixed16BE(buf, bXYZOffset + 16, 0.7141733);

	for (const trcOffset of [rTRCOffset, gTRCOffset, bTRCOffset]) {
		writeAscii(buf, trcOffset, "curv");
		writeUint32BE(buf, trcOffset + 8, 1);
		writeUint16BE(buf, trcOffset + 12, 563);
	}

	writeUint32BE(buf, 0, profileSize);

	return buf;
}
