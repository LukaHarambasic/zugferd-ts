export function roundAmount(value: number, dp: number = 2): number {
	const factor = 10 ** dp;
	return (
		(Math.sign(value) *
			Math.round((Math.abs(value) + Number.EPSILON) * factor)) /
		factor
	);
}

export function formatAmount(value: number): string {
	return roundAmount(value, 2).toFixed(2);
}

export function formatPrice(value: number): string {
	return roundAmount(value, 4).toFixed(4);
}

export function formatQuantity(value: number): string {
	return roundAmount(value, 2).toFixed(2);
}

export function formatPercent(value: number): string {
	return roundAmount(value, 2).toFixed(2);
}

export function withinTolerance(
	computed: number,
	stated: number,
	elementCount: number,
): boolean {
	return (
		roundAmount(Math.abs(computed - stated), 2) <=
		roundAmount(0.01 * elementCount, 2)
	);
}

export function parseAmount(value: string): number {
	return Number.parseFloat(value);
}
