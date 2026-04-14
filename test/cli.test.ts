import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import path from "node:path";
import test from "node:test";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

test("claude wrapper injects local ANTHROPIC_BASE_URL and preserves upstream", async () => {
  const tsxCliPath = path.resolve("node_modules/tsx/dist/cli.mjs");
  const cliPath = path.resolve("src/cli.ts");

  const { stdout } = await execFileAsync(
    process.execPath,
    [
      tsxCliPath,
      cliPath,
      "claude",
      "--claude-command",
      process.execPath,
      "--",
      "-e",
      "console.log(JSON.stringify({ base: process.env.ANTHROPIC_BASE_URL, upstream: process.env.PROMPT_GATEWAY_UPSTREAM_URL }))",
    ],
    {
      cwd: process.cwd(),
      env: {
        ...process.env,
        ANTHROPIC_BASE_URL: "https://litellm.example.com/anthropic",
      },
    },
  );

  const lines = stdout.trim().split("\n");
  const payloadLine = lines.at(-1);
  assert.ok(payloadLine);

  const payload = JSON.parse(payloadLine) as {
    base?: string;
    upstream?: string;
  };

  assert.match(payload.base || "", /^http:\/\/127\.0\.0\.1:\d+$/);
  assert.equal(payload.upstream, "https://litellm.example.com/anthropic");
});
