import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";
import path from "path";

const execAsync = promisify(exec);

export async function POST(request: Request) {
  try {
    const { transcript, faceImage } = await request.json();

    if (!transcript) {
      return NextResponse.json({ status: "error", error: "Transcript is required" }, { status: 400 });
    }

    const rootDir = process.cwd();
    const inputPath = path.join(rootDir, "input.json");
    
    // Write input to a file to safely pass large base64 strings to Python
    await fs.writeFile(inputPath, JSON.stringify({ transcript, faceImage }), "utf-8");

    const command = `uv run orchestrator.py`;
    console.log(`Running agent orchestrator...`);
    
    try {
      const { stdout, stderr } = await execAsync(command, { 
        cwd: rootDir,
        maxBuffer: 1024 * 1024 * 10 // 10MB to handle large base64 strings
      });
      
      if (stderr) {
        console.warn("Python Agent Stderr:", stderr);
      }
      
      const lines = stdout.trim().split('\n');
      const lastLine = lines[lines.length - 1];
      const result = JSON.parse(lastLine);
      
      return NextResponse.json(result);
    } catch (execError: any) {
      console.error("Execution Error. stdout:", execError.stdout);
      console.error("Execution Error. stderr:", execError.stderr);
      
      try {
        const lines = execError.stdout.trim().split('\n');
        const lastLine = lines[lines.length - 1];
        if (lastLine) {
          const result = JSON.parse(lastLine);
          return NextResponse.json(result);
        }
      } catch (e) {}

      return NextResponse.json({ 
        status: "error",
        error: execError.message,
        stdout: execError.stdout,
        stderr: execError.stderr
      }, { status: 500 });
    }
    
  } catch (error: any) {
    console.error("API Route General Error:", error);
    return NextResponse.json({ status: "error", error: error.message }, { status: 500 });
  }
}
