import {defineConfig} from "vitest/config";

export default defineConfig({
    test: {
        coverage: {
            include: ['src/**'],
            all: true,
            reporter: ['text'],
            thresholdAutoUpdate: true,
            lines: 70.28,
            functions: 70,
            branches: 86.95,
            statements: 70.28,
        }
    }
})
