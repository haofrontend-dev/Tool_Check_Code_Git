import { NextResponse } from 'next/server';
import { simpleGit } from 'simple-git';
import JSZip from 'jszip';

export async function POST(request: Request) {
    try {
        const { projectPath, to, selectedFiles } = await request.json();
        const git = simpleGit(projectPath);
        const zip = new JSZip();

        for (const filePath of selectedFiles) {
            try {
                const content = await git.show([`${to || 'HEAD'}:${filePath}`]);
                zip.file(filePath, content);
            } catch (e) {
                console.error(`Could not get content for ${filePath}`, e);
            }
        }

        const b64 = await zip.generateAsync({ type: 'base64' });

        return NextResponse.json({
            zip: b64,
            filename: `export_${new Date().getTime()}.zip`
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
