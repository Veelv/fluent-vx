declare module 'html-minifier-terser' {
  export function minify(html: string, options?: any): Promise<string>;
}