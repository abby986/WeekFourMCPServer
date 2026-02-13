What I Built:
I built a MCP (Model Context Protocol) server that gives Claude Code tools to save, list, read, and search through notes. It uses the stdin (standard input) and stdout (standard output) processes to retrieve and send out notes created by the user and stores them on the user's local machine. These notes are able to be recalled by Claude, helping to give it persistent memory of past sessions.

Design Decisions:
This server was designed to be simple. Notes are simple .md files stored in a single ~/dev-notes/ folder. Because of this, notes can be opened and edited outside of the server and still be recalled by Claude. The notes folder lives outside of the project folder so that the notes aren't attached to any single project and can be accessed easily by Claude.





How Claude Code Helped:
After having an error and checking for bugs, I wrote a specific and effective prompt asking "edit the list tool so that it returns the items in the correct order, and allows one process to finish before firing the next." After that, it fixed the problem and explained to me what the fixes were and how they worked. Testing the tools in the server again went smoothly with no more errors. After that, I decided I wanted to add another tool to the server. I specifically asked Claude to "add a new tool called "search_notes" that allows users to search for a note by its name, filepath, or date." That prompt was simple and effective in adding the additional tool with no errors to the server.




Debugging:
I encountered a couple errors throughout the process of creating this mcp server. I ran into an issue where the list was not returning list items in the correct order, and it was immediately returing the "Saved!" message before the file actually finished saving. To fix the saving issue, Claude rewrote the functions with the "await" and "async" keywords to tell JavaScript to wait for a process to finish before moving to the next line. Claude fixed the list order issue by using maps and "promise.all" to put the items in an array, run them all at once, wait until they all resolve, and return a single array with all the results in the order they were input. I also had a file save to the wrong place, but that was easily caught by Claude and fixed.




MCP Architecture:
MCP (Model Context Protocol) is a way to connect AI coding agents like Claude Code to external tools, sort of like using extensions in your browser. In terms of architecture, it communicates between the MCP host, which would be Claude, The MCP client, which is built into the host and manages connections, and the MCP server, which is the code with the tools. The client communicates with the server to check what tools it has, and makes the connection for the host, so the host can use the tools.




What I'd do Differently:

Overall, I feel that my approach was effective in giving me what I wanted with minimal prompts. I think the main things I would do differently is make sure that I am even more specific to avoid errors, and double check that I typed filepaths correctly.
