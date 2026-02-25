import { NextResponse } from 'next/server';
import { simpleGit } from 'simple-git';
import fs from 'fs';
import path from 'path';

export async function POST(request: Request) {
    try {
        const { projectPath, filePath, mode } = await request.json();

        const fullPath = path.join(projectPath, filePath);
        if (!fs.existsSync(fullPath)) {
            return NextResponse.json({ error: 'File not found' }, { status: 404 });
        }

        let content = fs.readFileSync(fullPath, 'utf8');

        // Logic for "Swap Comment": 
        // This is a basic implementation that looks for specific tags or toggles common debug patterns.
        // For now, let's implement a toggle for "// @debug" lines.

        const lines = content.split('\n');
        const updatedLines = lines.map(line => {
            // Detect common tags: @debug, @temp, @dev, console.log
            const debugPatterns = ['@debug', '@temp', '@dev', 'console.log'];
            const hasDebugTag = debugPatterns.some(tag => line.includes(tag));

            if (hasDebugTag) {
                const trimmed = line.trim();
                // Toggle comment
                if (trimmed.startsWith('//')) {
                    // Extract the content after // and keep indentation
                    return line.replace(/^(\s*)\/\/\s?/, '$1');
                } else if (trimmed.startsWith('/*') && trimmed.endsWith('*/')) {
                    return line.replace(/^(\s*)\/\*\s?/, '$1').replace(/\s?\*\/$/, '');
                } else {
                    // Comment out
                    const indentation = line.match(/^\s*/)?.[0] || '';
                    return `${indentation}// ${trimmed}`;
                }
            }
            return line;
        });

        const updatedContent = updatedLines.join('\n');
        fs.writeFileSync(fullPath, updatedContent);

        return NextResponse.json({ success: true, message: 'Comments swapped successfully' });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
