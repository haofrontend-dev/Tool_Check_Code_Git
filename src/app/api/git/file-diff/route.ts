import { NextResponse } from 'next/server';
import { simpleGit } from 'simple-git';
import fs from 'fs/promises';
import path from 'path';

export async function POST(request: Request) {
    try {
        const { projectPath, filePath } = await request.json();
        const git = simpleGit(projectPath);

        if (!filePath) {
            return NextResponse.json({ error: 'File path is required' }, { status: 400 });
        }

        // Check status to see if it's untracked
        const status = await git.status();
        const isUntracked = status.not_added.includes(filePath);

        let diff = '';

        if (isUntracked) {
            // For untracked files, read from disk and show as all additions
            try {
                const fullPath = path.join(projectPath, filePath);
                const content = await fs.readFile(fullPath, 'utf8');
                diff = content.split('\n').map(line => `+${line}`).join('\n');
            } catch (e) {
                diff = 'Error reading untracked file content.';
            }
        } else {
            // Get diff for tracked files (staged and unstaged vs HEAD)
            diff = await git.diff(['HEAD', '--', filePath]);
        }

        return NextResponse.json({
            filePath,
            diff: diff || 'No changes detected in this file.'
        });
    } catch (error: any) {
        console.error('[File Diff API Error]', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
