import { NextResponse } from 'next/server';
import { simpleGit } from 'simple-git';

export async function POST(request: Request) {
    try {
        const { projectPath, action, data } = await request.json();
        const git = simpleGit(projectPath);

        switch (action) {
            case 'create-branch':
                if (!data.name) throw new Error('Branch name is required');
                await git.checkoutLocalBranch(data.name);
                return NextResponse.json({ success: true, message: `Created and switched to branch ${data.name}` });

            case 'switch-branch':
                if (!data.name) throw new Error('Branch name is required');
                await git.checkout(data.name);
                return NextResponse.json({ success: true, message: `Switched to branch ${data.name}` });

            case 'merge':
                if (!data.from) throw new Error('Source branch is required');
                try {
                    await git.merge([data.from]);
                    return NextResponse.json({ success: true, message: `Merged ${data.from} successfully` });
                } catch (err: any) {
                    if (err.message.includes('CONFLICT')) {
                        return NextResponse.json({
                            success: false,
                            conflict: true,
                            message: 'Merge conflict detected. Please resolve.',
                            files: err.git?.merge?.conflicts || []
                        });
                    }
                    throw err;
                }

            case 'get-conflicts':
                const statusConfirm = await git.status();
                return NextResponse.json({ conflicts: statusConfirm.conflicted });

            case 'resolve-conflict':
                if (!data.file || !data.strategy) throw new Error('File and strategy required');
                // strategy: ours, theirs, or manual (assumed already edited)
                if (data.strategy === 'ours') await git.checkout(['--ours', data.file]);
                else if (data.strategy === 'theirs') await git.checkout(['--theirs', data.file]);

                await git.add(data.file);
                return NextResponse.json({ success: true, message: `Resolved conflict in ${data.file}` });

            case 'pull':
                try {
                    await git.pull();
                    return NextResponse.json({ success: true, message: 'Pulled latest changes from remote' });
                } catch (err: any) {
                    if (err.message.includes('CONFLICT')) {
                        return NextResponse.json({
                            success: false,
                            conflict: true,
                            message: 'Pull resulted in conflicts. Please resolve.',
                            files: err.git?.pull?.conflicts || []
                        });
                    }
                    throw err;
                }

            case 'fetch':
                await git.fetch();
                return NextResponse.json({ success: true, message: 'Fetched latest from remote' });

            case 'status':
                const status = await git.status();
                return NextResponse.json(status);

            default:
                throw new Error('Invalid action');
        }
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
