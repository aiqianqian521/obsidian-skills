# Project File Archive

Use this when the user says the knowledge base should include key files, move files into the vault, classify project files, or make the vault portable for later migration.

## Principle

The vault must contain both:

- interpreted knowledge notes: daily, project, problem, concept, decision, playbook, skill
- original assets: source documents, code snapshots, configs, logs, validation outputs, and attachments that support those notes

Copy project assets into the vault by default. Do not delete or physically move runnable project files unless the user explicitly asks to remove them from the source project after backup.

## Target Layout

Use the configured source directory and `directory_style` from the current project `.obsidian.yaml`.

```text
90_原始来源/
  会话记录/
  项目文件/
    {project_name}/
      文档/
      代码/
      配置/
      验证输出/
      附件/
      asset-index.md
      asset-manifest.json
```

For English directory mappings, use English archive folders:

```text
90_Sources/
  Sessions/
  Project Files/
    {project_name}/
      Documents/
      Code/
      Config/
      Validation Outputs/
      Attachments/
      asset-index.md
      asset-manifest.json
```

## Classification

| Source file | Vault category | Notes |
| --- | --- | --- |
| project Markdown, design docs, requirement docs, requirement `.txt` | `文档` / `Documents` | Preserve as raw source even when distilled notes already exist |
| runnable source code or scripts | `代码` / `Code` | Copy as evidence/reference; do not remove from the project |
| `.yaml`, `.json`, `.toml`, `.env`, config files | `配置` / `Config` | Store if useful for reproduction; mask secrets when detected |
| command output, logs, result files, test output | `验证输出` / `Validation Outputs` | High value because they prove conclusions |
| images, PDFs, zips, unknown binary files | `附件` / `Attachments` | Preserve when relevant or user-supplied |
| cache/build artifacts such as `__pycache__`, `.pyc`, `node_modules` | skip by default | Include only if the user explicitly asks |

## Procedure

1. Read the current project `.obsidian.yaml` and resolve `vault_path`, `project_name`, `directory_style`, and directory mappings.
2. Inventory the source project files.
3. Skip caches and generated build artifacts by default.
4. Copy useful files into `90_原始来源/项目文件/{project_name}/...` or `90_Sources/Project Files/{project_name}/...` by classification.
5. Preserve relative paths below each category when useful.
6. Generate `asset-manifest.json` with original path, vault path, size, SHA256, and category.
7. Generate `asset-index.md` for human navigation.
8. Update `99_系统/asset-index.md`.
9. Add an `Archived Project Files` section to the project note.
10. Link distilled notes back to the source note and the asset index when files are evidence.

## Report

Every archive task must report:

- copied or updated asset count
- unchanged asset count
- skipped categories and why
- asset index path
- manifest path
- original project files left in place or deleted
- verification result after reading back the asset index and manifest
