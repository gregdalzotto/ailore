# VHS tape for the ailore demo GIF.
# Generate with:  vhs media/demo.tape   (run from the repo root, with Ollama running)
# Docs: https://github.com/charmbracelet/vhs

Output media/demo.gif

Require ailore

Set Shell bash
Set FontSize 18
Set Width 1200
Set Height 760
Set Padding 20
Set Theme "Catppuccin Mocha"
Set TypingSpeed 55ms

# 1. Index the project (fast when the index is already warm)
Type "ailore index"
Sleep 800ms
Enter
Sleep 4s

# 2. Semantic search — instant, no LLM
Type "ailore search 'how are changed files detected during indexing?'"
Sleep 800ms
Enter
Sleep 4s

# 3. Ask — a grounded answer with citations (kept short for a tight GIF)
Type "ailore ask --no-stream -t 0 --max-tokens 90 'how does incremental indexing work?'"
Sleep 800ms
Enter
Sleep 14s

Sleep 2s
