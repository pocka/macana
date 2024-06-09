// SPDX-FileCopyrightText: 2024 Shota FUJI <pockawoooh@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0

interface Context {
	fieldPath: readonly string[];
}

function getFieldName(ctx: Context): string {
	if (ctx.fieldPath.length === 0) {
		return "<rootObject>";
	}

	return ctx.fieldPath.join(".");
}

class MacanaCLIConfigParsingError extends Error {}

class FieldConstraintError extends MacanaCLIConfigParsingError {
	constructor(ctx: Context, beWhat: string) {
		super(
			`Invalid config: "${getFieldName(ctx)}" MUST be ${beWhat}`,
		);
	}
}

class UnexpectedFieldTypeError extends MacanaCLIConfigParsingError {
	constructor(ctx: Context, expected: string, found: string) {
		super(
			`Invalid config: "${
				getFieldName(ctx)
			}" MUST be ${expected} but found ${found}`,
		);
	}
}

export type Parser<T> = (x: unknown, ctx: Context) => T;

export function parse<T>(x: unknown, parser: Parser<T>): T {
	return parser(x, {
		fieldPath: [],
	});
}

export interface ObjectParserOptions {
	optional?: boolean;
}

export function object<T>(
	fields: { [K in keyof T]: Parser<T[K]> },
	options?: { optional: true },
): Parser<Partial<T>>;
export function object<T>(
	fields: { [K in keyof T]: Parser<T[K]> },
	options: { optional: false },
): Parser<T>;
export function object<T>(
	fields: { [K in keyof T]: Parser<T[K]> },
	{ optional = true }: ObjectParserOptions = {},
): Parser<Partial<T>> {
	return (x, ctx) => {
		if (typeof x !== "object") {
			throw new UnexpectedFieldTypeError(ctx, "object", typeof x);
		}

		if (!x) {
			throw new UnexpectedFieldTypeError(ctx, "object", "null");
		}

		const obj: Partial<T> = {};
		for (const fieldName in fields) {
			if (fieldName in x) {
				obj[fieldName] = fields[fieldName]((x as T)[fieldName], {
					fieldPath: [...ctx.fieldPath, fieldName],
				});
				continue;
			}

			if (!optional) {
				throw new MacanaCLIConfigParsingError(
					`Invalid config: "${
						getFieldName(ctx)
					}" MUST have "${fieldName}" field`,
				);
			}
		}

		return obj;
	};
}

export function record<K extends string, V>(
	keyParser: Parser<K>,
	valueParser: Parser<V>,
): Parser<Record<K, V>> {
	return (x, ctx) => {
		if (typeof x !== "object") {
			throw new UnexpectedFieldTypeError(ctx, "object(record)", typeof x);
		}

		if (!x) {
			throw new UnexpectedFieldTypeError(ctx, "object(record)", "null");
		}

		const rec: Partial<Record<K, V>> = {};

		for (const key in x) {
			const parsedKey = keyParser(key, {
				fieldPath: [...ctx.fieldPath, "(key)"],
			});

			const parsedValue = valueParser((x as Record<K, V>)[key as K], {
				fieldPath: [...ctx.fieldPath, key],
			});

			rec[parsedKey] = parsedValue;
		}

		return rec as Record<K, V>;
	};
}

export interface StringParserOptions {
	nonEmpty?: boolean;

	trim?: boolean;
}

export function string(
	{ nonEmpty = false, trim = false }: StringParserOptions = {},
): Parser<string> {
	return (x, ctx) => {
		if (typeof x !== "string") {
			throw new UnexpectedFieldTypeError(ctx, "string", typeof x);
		}

		const value = trim ? x.trim() : x;

		if (nonEmpty && !value) {
			throw new FieldConstraintError(ctx, "non-empty string");
		}

		return value;
	};
}

export const boolean: Parser<boolean> = (x, ctx) => {
	if (typeof x !== "boolean") {
		throw new UnexpectedFieldTypeError(ctx, "boolean", typeof x);
	}

	return x;
};

export function arrayOf<T>(parser: Parser<T>): Parser<readonly T[]> {
	return (x, ctx) => {
		if (!Array.isArray(x)) {
			throw new UnexpectedFieldTypeError(ctx, "array", typeof x);
		}

		return x.map((v, i) =>
			parser(v, {
				fieldPath: [...ctx.fieldPath, i.toString(10)],
			})
		);
	};
}

export function map<A, B>(parser: Parser<A>, fn: (a: A) => B): Parser<B> {
	return (x, ctx) => {
		return fn(parser(x, ctx));
	};
}
