/**
 * Markdown 美化工具
 * 不改变文字内容，只优化 markdown 样式
 */

/**
 * 美化 markdown 内容
 * @param content 原始 markdown 内容
 * @returns 美化后的 markdown 内容
 */
export function beautifyMarkdown(content: string): string {
    let result = content;

    // 1. 标准化换行符
    result = result.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    // 2. 处理末尾多余空行（保留最多2个）
    result = result.replace(/\n{3,}$/g, '\n\n');

    // 3. 处理开头多余空行
    result = result.replace(/^\n+/, '');

    // 4. 标题规范化：确保 # 后面有空格
    result = result.replace(/^(#+)([^\s#])/gm, '$1 $2');

    // 5. 标题上下空白行规范化
    result = result.replace(/([^\n])\n(#+ )/g, '$1\n\n$2'); // 标题前加空行
    result = result.replace(/^(#+ .+)\n([^#\n])/gm, '$1\n\n$2'); // 标题后加空行（非标题内容前）
    result = result.replace(/^(#+ .+)\n(={3,})/gm, '$1\n\n$2'); // 标题后是分隔线

    // 6. 列表规范化
    // 确保列表项前后有空白行（顶层列表除外）
    result = result.replace(/([^\n])\n(\*|-|\d+\.) /g, '$1\n\n$2 ');
    result = result.replace(/(\*|-|\d+\. [^\n]+)\n([^\n*-\d])/g, '$1\n\n$2');

    // 7. 缩进列表（2-4个空格）前后加空行
    result = result.replace(/([^\n])\n( {2,4})(\*|-|\d+\.) /g, '$1\n\n$2$3 ');
    result = result.replace(/( {2,4})(\*|-|\d+\. [^\n]+)\n([^\s*-\d])/g, '$1$2\n\n$3');

    // 8. 无序列表符号统一为 -
    result = result.replace(/^(\s*)[\*\-]\s+([^\n]+)$/gm, (match, indent, text) => {
        // 检查是否在代码块内
        if (/```/.test(match)) return match;
        return `${indent}- ${text}`;
    });

    // 9. 有序列表从1开始重新编号
    result = result.replace(/(^|\n)(\s*)(\d+)\.(\s+)/g, (match, newline, indent, num, space) => {
        if (/```/.test(match)) return match;
        return newline + indent + '1.' + space;
    });

    // 10. 代码块规范化
    // ``` 前后加空行
    result = result.replace(/([^\n])\n```/g, '$1\n\n```');
    result = result.replace(/```\n([^\n#])/g, '```\n\n$1');
    result = result.replace(/([^\n])\n```/g, '$1\n\n```');
    result = result.replace(/```\n([^\n#*=-])/g, '```\n\n$1');

    // 11. 表格前后加空行
    result = result.replace(/([^\n])\n\|/g, '$1\n\n|');
    result = result.replace(/\|[^\n]+\n([^|\n-])/g, '|$1\n\n$1');

    // 12. 分隔线规范化
    result = result.replace(/([^\n])(---|\*\*\*|___)/g, '$1\n\n$2');
    result = result.replace(/(---|\*\*\*|___)\n([^\n])/g, '$1\n\n$2');

    // 13. Callout 规范化
    // > [!type] 前后加空行
    result = result.replace(/([^\n])\n> \[!/g, '$1\n\n> [!');
    result = result.replace(/> \[!([^\]]+)\]\n([^>\n])/g, '> [!$1]\n\n$2');

    // 14. 引用块内部空行规范化（引用块内多个空行合并为一个）
    result = result.replace(/>\s*\n\s*\n\s*>/g, '>\n>');

    // 15. 行内代码格式化（去除多余空格）
    result = result.replace(/`\s+/g, '`');
    result = result.replace(/\s+`/g, '`');

    // 16. 链接和图片格式规范化
    // [text](url) 保持原样，不做处理

    // 17. 段落间距：非列表/代码块/表格内容之间保持一个空行
    result = result.replace(/([^\n])\n([^\n*\-#>|`\s]|[^|\-])/g, '$1\n\n$2');

    // 18. 清理临时规则造成的多余空行（再次处理）
    result = result.replace(/\n{4,}/g, '\n\n');

    // 19. 确保文件末尾有单一行尾
    result = result.replace(/\n+$/g, '') + '\n';

    return result;
}

/**
 * 智能美化：先解析再重新生成
 * 保留更精确的结构
 */
export function smartBeautifyMarkdown(content: string): string {
    const lines = content.split('\n');
    const result: string[] = [];
    let i = 0;

    while (i < lines.length) {
        const line = lines[i];
        const trimmed = line.trim();

        // 跳过已处理的多余空行
        if (trimmed === '' && result.length > 0 && result[result.length - 1] === '') {
            i++;
            continue;
        }

        // 标题
        if (/^#+ /.test(trimmed)) {
            // 确保标题前有空行（除非是第一个内容）
            if (result.length > 0 && result[result.length - 1] !== '') {
                result.push('');
            }
            result.push(trimmed);
            i++;

            // 标题后加空行
            while (i < lines.length && lines[i].trim() === '') {
                i++;
            }
            if (i < lines.length && !/^#+ /.test(lines[i].trim()) && !/^---/.test(lines[i].trim())) {
                result.push('');
            }
            continue;
        }

        // 无序列表
        if (/^(\s*)([-*]|\d+\.)\s/.test(trimmed)) {
            const indentMatch = line.match(/^(\s*)/);
            const indent = indentMatch ? indentMatch[1] : '';

            // 列表前加空行
            if (result.length > 0 && result[result.length - 1] !== '' && !/^(\s*)([-*]|\d+\.)\s/.test(result[result.length - 1])) {
                result.push('');
            }
            result.push(line);
            i++;

            // 处理连续列表项
            while (i < lines.length) {
                const nextLine = lines[i];
                const nextTrimmed = nextLine.trim();

                if (/^(\s*)([-*]|\d+\.)\s/.test(nextTrimmed)) {
                    result.push(nextLine);
                    i++;
                } else if (nextTrimmed === '') {
                    // 空行表示列表结束
                    result.push('');
                    i++;
                    break;
                } else {
                    break;
                }
            }
            continue;
        }

        // 代码块
        if (/^```/.test(trimmed)) {
            const language = trimmed.slice(3);
            const codeBlockStart = line;

            // 代码块前加空行
            if (result.length > 0 && result[result.length - 1] !== '') {
                result.push('');
            }
            result.push(codeBlockStart);
            i++;

            // 找到代码块结束
            while (i < lines.length && !/^```/.test(lines[i].trim())) {
                result.push(lines[i]);
                i++;
            }

            // 找到结束标记
            if (i < lines.length && /^```/.test(lines[i].trim())) {
                result.push(lines[i]);
                i++;
            }

            // 代码块后加空行
            result.push('');
            continue;
        }

        // 分隔线
        if (/^[-*_]{3,}$/.test(trimmed)) {
            if (result.length > 0 && result[result.length - 1] !== '') {
                result.push('');
            }
            result.push(trimmed);
            i++;
            result.push('');
            continue;
        }

        // 引用块
        if (/^>/.test(trimmed)) {
            // 引用前加空行
            if (result.length > 0 && result[result.length - 1] !== '') {
                result.push('');
            }

            // 收集引用块
            while (i < lines.length && /^>/.test(lines[i].trim())) {
                result.push(lines[i]);
                i++;
            }
            continue;
        }

        // 普通段落
        result.push(trimmed);
        i++;
    }

    // 移除开头空行
    while (result.length > 0 && result[0] === '') {
        result.shift();
    }

    // 移除末尾多余空行
    while (result.length > 0 && result[result.length - 1] === '') {
        result.pop();
    }

    // 确保末尾有换行
    if (result.length > 0) {
        return result.join('\n') + '\n';
    }

    return content;
}
