import { NextResponse } from 'next/server';
import { simpleGit } from 'simple-git';

export async function POST(request: Request) {
    try {
        const { projectPath, base, head } = await request.json();
        const git = simpleGit(projectPath);

        if (!base || !head) {
            return NextResponse.json({ error: 'Base and Head branches are required' }, { status: 400 });
        }

        // Get comparison summary
        const summary = await git.diffSummary([`${base}..${head}`]);

        // Get full diff
        const diff = await git.diff([`${base}..${head}`]);

        // Get remote info for PR link generation
        const remotes = await git.getRemotes(true);
        const origin = remotes.find(r => r.name === 'origin');
        let githubUrl = '';

        if (origin) {
            // Convert git@github.com:user/repo.git or https://github.com/user/repo.git to https://github.com/user/repo
            githubUrl = origin.refs.push
                .replace('git@github.com:', 'https://github.com/')
                .replace('.git', '');
        }

        return NextResponse.json({
            base,
            head,
            summary,
            diff: diff || 'No differences found between these branches.',
            githubUrl: githubUrl ? `${githubUrl}/compare/${base}...${head}` : ''
        });
    } catch (error: any) {
        console.error('[Compare API Error]', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
