# Required Skills (Install Reference)

These are reference copies of skill packages that the obsidian-router depends on.
They are bundled here for offline installation and migration scenarios.

**Runtime**: The agent loads skills from the top-level `skills/` directory, not from this
directory. These copies do not participate in skill execution. They are installation
reference artifacts only.

To install the full skill set:

```bash
npx skills add https://github.com/kepano/obsidian-skills
```

## Bundled Skills

| Skill | Purpose |
|-------|---------|
| obsidian-bases | Database-like views of notes |
| obsidian-cli | Obsidian CLI interaction |
| obsidian-markdown | Obsidian Flavored Markdown formatting |
| defuddle | Web page content extraction |
| json-canvas | JSON Canvas file editing |