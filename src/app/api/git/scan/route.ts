import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { simpleGit } from 'simple-git';

export async function POST(request: Request) {
    try {
        const { workspacePath } = await request.json();

        if (!workspacePath || !fs.existsSync(workspacePath)) {
            return NextResponse.json({ error: 'Invalid workspace path' }, { status: 400 });
        }

        const items = fs.readdirSync(workspacePath);
        const projects = [];

        for (const item of items) {
            const fullPath = path.join(workspacePath, item);
            if (fs.statSync(fullPath).isDirectory()) {
                const git = simpleGit(fullPath);
                if (await git.checkIsRepo()) {
                    projects.push({
                        name: item,
                        path: fullPath
                    });
                }
            }
        }

        return NextResponse.json({ projects });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
