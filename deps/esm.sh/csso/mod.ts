// SPDX-FileCopyrightText: 2024 Shota FUJI <pockawoooh@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0

import * as csso from "npm:csso@~5.0.5";

export const minify: (css: string) => { css: string } = csso.minify;
