// Terminal-style code blocks with copy functionality
document.addEventListener('DOMContentLoaded', function() {
    const codeBlocks = document.querySelectorAll('.post-content .highlighter-rouge, .post-content > pre:not(.highlight)');

    codeBlocks.forEach(function(block, index) {
        if (block.closest('.terminal-window')) return;

        const pre = block.tagName === 'PRE' ? block : block.querySelector('pre');
        if (!pre) return;

        const code = pre.querySelector('code') || pre;
        // Strip leading $ prompts from each line for clean copy-paste
        const codeText = code.textContent
            .split('\n')
            .map(line => line.replace(/^\$\s?/, ''))
            .join('\n')
            .trim();

        const wrapper = document.createElement('div');
        wrapper.className = 'terminal-window';

        const header = document.createElement('div');
        header.className = 'terminal-header';

        const prompt = document.createElement('div');
        prompt.className = 'terminal-prompt';

        const copyBtn = document.createElement('button');
        copyBtn.className = 'terminal-copy';
        copyBtn.textContent = 'copy';
        copyBtn.addEventListener('click', function() {
            navigator.clipboard.writeText(codeText).then(function() {
                copyBtn.classList.add('copied');
                copyBtn.textContent = 'copied';
                setTimeout(function() {
                    copyBtn.classList.remove('copied');
                    copyBtn.textContent = 'copy';
                }, 2000);
            }).catch(function(err) {
                console.error('Failed to copy:', err);
            });
        });

        header.appendChild(prompt);
        header.appendChild(copyBtn);

        block.parentNode.insertBefore(wrapper, block);
        wrapper.appendChild(header);
        wrapper.appendChild(block);
    });
});
