import lighthouse from "lighthouse";
import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import os from "node:os";
import config from "../lighthouse.config.mjs";

const output = "reports/lighthouse";
await mkdir(output, { recursive: true });
const results = [];
for (const [page, path] of Object.entries(config.pages)) {
  for (const profile of ["mobile", "desktop"]) {
    for (let run = 1; run <= config.runs; run++) {
      const browser = await chromium.launch({
        args: ["--remote-debugging-port=9222"],
      });
      try {
        const result = await lighthouse(config.baseUrl + path, {
          port: 9222,
          output: ["html", "json"],
          logLevel: "error",
          onlyCategories: config.categories,
          ...config[profile],
        });
        if (!result || result.lhr.runtimeError)
          throw new Error(JSON.stringify(result?.lhr.runtimeError));
        const prefix = `${output}/${page}-${profile}-${run}`;
        await writeFile(`${prefix}.html`, result.report[0]);
        await writeFile(`${prefix}.json`, result.report[1]);
        const item = {
          page,
          profile,
          run,
          lighthouse: result.lhr.lighthouseVersion,
          browser: await browser.version(),
          scores: Object.fromEntries(
            Object.entries(result.lhr.categories).map(([key, value]) => [
              key,
              Math.round(value.score * 100),
            ]),
          ),
          metrics: Object.fromEntries(
            [
              "largest-contentful-paint",
              "cumulative-layout-shift",
              "total-blocking-time",
            ].map((key) => [key, result.lhr.audits[key].numericValue]),
          ),
        };
        results.push(item);
        console.log(JSON.stringify(item));
        await writeFile(
          `${output}/results.json`,
          JSON.stringify(
            {
              environment: {
                node: process.version,
                platform: os.platform(),
                release: os.release(),
                cpu: os.cpus()[0].model,
                date: new Date().toISOString(),
                baseUrl: config.baseUrl,
              },
              results,
            },
            null,
            2,
          ),
        );
      } finally {
        await browser.close();
      }
    }
  }
}
const median = (values) =>
  values.sort((a, b) => a - b)[Math.floor(values.length / 2)];
const rows = [];
for (const page of Object.keys(config.pages))
  for (const profile of ["mobile", "desktop"]) {
    const subset = results.filter(
      (r) => r.page === page && r.profile === profile,
    );
    rows.push({
      page,
      profile,
      scores: Object.fromEntries(
        config.categories.map((k) => [
          k,
          median(subset.map((r) => r.scores[k])),
        ]),
      ),
      metrics: Object.fromEntries(
        Object.keys(subset[0].metrics).map((k) => [
          k,
          median(subset.map((r) => r.metrics[k])),
        ]),
      ),
    });
  }
await writeFile(`${output}/medians.json`, JSON.stringify(rows, null, 2));
console.log("Auditoria concluída; medianas em reports/lighthouse/medians.json");
