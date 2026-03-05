import { NextResponse } from 'next/server';
import { simpleGit } from 'simple-git';

export async function POST(request: Request) {
    try {
        const { projectPath } = await request.json();
        const git = simpleGit(projectPath);

        const isRepo = await git.checkIsRepo();
        if (!isRepo) {
            return NextResponse.json({
                isRepo: false,
                projectPath,
                name: projectPath.split('/').pop()
            });
        }

        const branches = await git.branch();
        const tags = await git.tags();

        // Stats
        const totalCommits = await git.raw(['rev-list', '--count', 'HEAD']).catch(() => '0');
        const status = await git.status();
        const isDirty = !status.isClean();

        // Authors count
        const authorsRaw = await git.raw(['shortlog', '-sn', 'HEAD']).catch(() => '');
        const authorsCount = authorsRaw.trim().split('\n').filter(Boolean).length;

        // Activity Feed (Last 5)
        const activityLogs = await git.log({ maxCount: 5 });
        const lastCommit = activityLogs.latest;

        // Resulting Remote URL (Origin)
        const remoteUrl = await git.remote(['get-url', 'origin']).catch(() => '');

        return NextResponse.json({
            branches: branches.all,
            current: branches.current,
            tags: tags.all,
            remoteUrl: (remoteUrl || '').trim(),
            stats: {
                totalCommits: parseInt(totalCommits.trim()),
                authorsCount,
                isDirty,
                lastCommit,
                activity: activityLogs.all,
                files: status.files
            }
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
