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

            case 'init-git':
                if (!data.remoteUrl) throw new Error('Remote URL is required for initialization');

                // 1. Initialize repository
                await git.init();

                // 2. Add remote origin
                await git.addRemote('origin', data.remoteUrl);

                // 3. Set default branch to main (Professional standard)
                await git.raw(['branch', '-M', 'main']);

                // 4. Initial content (README)
                const readmePath = require('path').join(projectPath, 'README.md');
                const fs = require('fs');
                if (!fs.existsSync(readmePath)) {
                    fs.writeFileSync(readmePath, `# ${projectPath.split('/').pop()}\n\nInitialized via Git Code Checker.`);
                }

                // 5. Build first commit
                await git.add('.');
                await git.commit('initial commit');

                // 6. Push to origin main with tracking
                await git.push(['-u', 'origin', 'main']);

                return NextResponse.json({
                    success: true,
                    message: `🚀 Repository successfully initialized and pushed to GitHub main branch!`
                });

            case 'atomic-integrate':
                if (!data.base || !data.head) throw new Error('Base and head branches required');
                const originalBranch = (await git.branchLocal()).current;
                try {
                    // 1. Push head branch
                    await git.push(['-u', 'origin', data.head]);

                    // 2. Checkout base branch
                    await git.checkout(data.base);

                    // 3. Merge head into base
                    try {
                        await git.merge([data.head]);
                    } catch (mergeErr: any) {
                        if (mergeErr.message.includes('CONFLICT')) {
                            return NextResponse.json({
                                success: false,
                                conflict: true,
                                message: `Atomic merge failed due to conflicts in ${data.base}. Please resolve manually.`,
                                files: mergeErr.git?.merge?.conflicts || []
                            });
                        }
                        throw mergeErr;
                    }

                    // 4. Push updated base branch
                    await git.push('origin', data.base);

                    // 5. Cleanup: Delete remote head branch (Closes PR lifecycle)
                    try {
                        await git.push(['origin', '--delete', data.head]);
                    } catch (e) {
                        console.warn('Failed to delete remote branch:', e);
                    }

                    // 6. Cleanup: Delete local head branch
                    try {
                        await git.deleteLocalBranch(data.head, true);
                    } catch (e) {
                        console.warn('Failed to delete local branch:', e);
                    }

                    // 7. Stay on base branch (common after merge)
                    await git.checkout(data.base);

                    return NextResponse.json({
                        success: true,
                        message: `🚀 Atomic Integration Complete: ${data.head} was merged into ${data.base} and closed.`
                    });
                } catch (err: any) {
                    await git.checkout(originalBranch).catch(() => { });
                    throw err;
                }

            default:
                throw new Error('Invalid action');
        }
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
