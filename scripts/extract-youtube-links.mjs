// One-off script: extracts "youtube" links embedded in a.html (a saved Next.js
// page dump) and merges them into striversSheet.js by matching problem titles,
// writing the enriched result to src/data/striversSheetv1.js.
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const htmlPath = path.join(root, "a.html");
const sheetPath = path.join(root, "src", "data", "striversSheet.js");
const outPath = path.join(root, "src", "data", "striversSheetv1.js");

function extractPushedStrings(html) {
    const chunks = [];
    const re = /self\.__next_f\.push\(\[1,\s*([\s\S]*?)\]\);/g;
    let match;
    while ((match = re.exec(html))) {
        // The captured text is a single-quoted JS string literal; eval it
        // (trusted local file we generated) to get the real decoded string.
        // eslint-disable-next-line no-eval
        chunks.push(eval(match[1]));
    }
    return chunks.join("");
}

function extractSectionsJson(blob) {
    const key = '"sections":[';
    const startIdx = blob.indexOf(key);
    if (startIdx === -1) {
        throw new Error('Could not find "sections":[ in extracted HTML data');
    }
    const arrayStart = startIdx + key.length - 1; // position of the opening [
    let depth = 0;
    let inString = false;
    let escaped = false;
    for (let i = arrayStart; i < blob.length; i += 1) {
        const ch = blob[i];
        if (inString) {
            if (escaped) {
                escaped = false;
            } else if (ch === "\\") {
                escaped = true;
            } else if (ch === '"') {
                inString = false;
            }
            continue;
        }
        if (ch === '"') {
            inString = true;
        } else if (ch === "[") {
            depth += 1;
        } else if (ch === "]") {
            depth -= 1;
            if (depth === 0) {
                return blob.slice(arrayStart, i + 1);
            }
        }
    }
    throw new Error(
        "Could not find matching closing bracket for sections array",
    );
}

function normalizeTitle(title) {
    return String(title || "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, " ")
        .trim();
}

const html = readFileSync(htmlPath, "utf8");
const blob = extractPushedStrings(html);
const sectionsJson = extractSectionsJson(blob);
const sections = JSON.parse(sectionsJson);

const youtubeByTitle = new Map();
for (const section of sections) {
    for (const subcategory of section.subcategories || []) {
        for (const problem of subcategory.problems || []) {
            const yt = problem.youtube;
            if (yt && yt !== "$undefined" && typeof yt === "string") {
                youtubeByTitle.set(normalizeTitle(problem.problem_name), yt);
            }
        }
    }
}

console.log(`Extracted ${youtubeByTitle.size} YouTube links from a.html`);

const { default: STRIVERS_SHEET } = await import(pathToFileURL(sheetPath));

let matched = 0;
let total = 0;
for (const step of STRIVERS_SHEET) {
    for (const subStep of step.subSteps) {
        for (const problem of subStep.problems) {
            total += 1;
            const yt = youtubeByTitle.get(normalizeTitle(problem.title));
            if (yt) {
                problem.ytLink = yt;
                matched += 1;
            }
        }
    }
}

console.log(`Matched ${matched}/${total} problems to a YouTube link`);

const header =
    "/** Striver's A2Z DSA Course Sheet (with YouTube links merged in) */\n\n";
const body = `const STRIVERS_SHEET = ${JSON.stringify(STRIVERS_SHEET, null, 4)};\n\nexport default STRIVERS_SHEET;\n`;
writeFileSync(outPath, header + body, "utf8");

console.log(`Wrote ${outPath}`);
