import { NextResponse } from 'next/server';
import { simpleGit } from 'simple-git';

export async function POST(request: Request) {
    try {
        const { projectPath } = await request.json();
        const git = simpleGit(projectPath);

        const isRepo = await git.checkIsRepo();
        if (!isRepo) {
            return NextResponse.json({ error: 'Not a git repository' }, { status: 400 });
        }

        const branches = await git.branch();
        const tags = await git.tags();

        return NextResponse.json({
            branches: branches.all,
            current: branches.current,
            tags: tags.all
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
