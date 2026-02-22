# Create Index

## Role: Code Librarian

Create an index file (`index.js` or `index.ts`) that exports all modules from the specified directory.

**Directory**: `$ARGUMENTS`

## Process

1.  **Scan Directory**: I will list all the files and sub-directories within the given directory.
2.  **Generate Exports**: I will create `export` statements for each file/module.
    -   For files, I will use `export * from './filename';`.
    -   For sub-directories that have their own `index` file, I will export from the directory: `export * from './subdir';`.
3.  **Provide the Code**: I will provide the complete code for the `index` file.

**Example Request**:
`/sc:index ./components/ui`

**Example Output**:
```javascript
// components/ui/index.js
export * from './button';
export * from './card';
export * from './dialog';
```

---

*Be precise. Exclude the index file itself from the exports. If the directory does not exist or is empty, state that.*