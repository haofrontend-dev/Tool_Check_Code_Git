import { NextResponse } from 'next/server';
import { simpleGit } from 'simple-git';

export async function POST(request: Request) {
    try {
        const { projectPath, from, to, limit = 50 } = await request.json();
        const git = simpleGit(projectPath);

        const logs = await git.log({
            from,
            to,
            maxCount: limit,
        });

        // Grouping logic: categorization by message prefix or conventional commits
        const grouped: Record<string, any[]> = {
            'Features': [],
            'Fixes': [],
            'Refactors': [],
            'Docs': [],
            'Other': []
        };

        logs.all.forEach(commit => {
            const msg = commit.message.toLowerCase();
            if (msg.startsWith('feat') || msg.includes('feature')) grouped['Features'].push(commit);
            else if (msg.startsWith('fix') || msg.includes('bug')) grouped['Fixes'].push(commit);
            else if (msg.startsWith('refactor')) grouped['Refactors'].push(commit);
            else if (msg.startsWith('docs')) grouped['Docs'].push(commit);
            else grouped['Other'].push(commit);
        });

        return NextResponse.json({
            total: logs.total,
            grouped
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
