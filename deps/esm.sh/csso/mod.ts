// SPDX-FileCopyrightText: 2024 Shota FUJI <pockawoooh@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0

import * as csso from "https://esm.sh/v135/csso@5.0.5/dist/csso.esm.js";

export const minify: (css: string) => { css: string } = csso.minify;
