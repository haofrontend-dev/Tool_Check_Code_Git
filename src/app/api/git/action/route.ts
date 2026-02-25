import { NextResponse } from 'next/server';
import { simpleGit } from 'simple-git';

export async function POST(request: Request) {
    try {
        const { projectPath, message, push = false } = await request.json();
        const git = simpleGit(projectPath);

        if (!message) {
            return NextResponse.json({ error: 'Commit message is required' }, { status: 400 });
        }

        // Add all changes
        await git.add('.');

        // Commit
        const commitResult = await git.commit(message);

        let pushResult = null;
        if (push) {
            // Push to current branch and set upstream automatically for new branches
            pushResult = await git.push(['-u', 'origin', 'HEAD']);
        }

        return NextResponse.json({
            success: true,
            commit: commitResult.commit,
            pushed: push !== false,
            pushResult
        });
    } catch (error: any) {
        console.error('[Action API Error]', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
