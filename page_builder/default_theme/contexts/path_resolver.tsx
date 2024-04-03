// SPDX-FileCopyrightText: 2024 Shota FUJI <pockawoooh@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0

/** @jsx h */

import {
	createContext,
	h,
	useContext,
} from "../../../deps/deno.land/x/nano_jsx/mod.ts";

interface PathResolver {
	resolve(path: readonly string[]): string;
}

const PathResolverContext = createContext({
	resolve(path: readonly string[]) {
		return path.join("/");
	},
});

export function usePathResolver(): PathResolver {
	return useContext(PathResolverContext);
}

export interface PathResolverProviderProps {
	/**
	 * How deep the path from the root?
	 * 0 for top-level documents.
	 * For example, the depth for "foo/bar/baz.html" is 2.
	 *
	 * @default 0
	 */
	depth?: number;

	children: JSX.ElementChildrenAttribute["children"];
}

export function PathResolverProvider(
	{ depth = 0, children }: PathResolverProviderProps,
) {
	const resolver: PathResolver = {
		resolve(path) {
			return Array.from({ length: depth }, () => "../").join("") +
				path.join("/");
		},
	};

	return (
		<PathResolverContext.Provider value={resolver}>
			{children}
		</PathResolverContext.Provider>
	);
}
