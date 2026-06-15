/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  webpack: (config) => {
    // ws (used by @supabase/realtime-js) tries to require optional native
    // bindings (bufferutil, utf-8-validate) at runtime via a variable —
    // webpack can't resolve these statically, hence the "Critical dependency"
    // warning. Setting them to false tells webpack to skip them safely.
    config.resolve.fallback = {
      ...config.resolve.fallback,
      bufferutil: false,
      'utf-8-validate': false,
    }
    return config
  },
}

export default config
