import config from '@conveyor/config/eslint';
import next from '@next/eslint-plugin-next';

export default [
  { ignores: ['.next/**', 'next-env.d.ts'] },
  ...config,
  {
    plugins: { '@next/next': next },
    rules: {
      ...next.configs.recommended.rules,
      ...next.configs['core-web-vitals'].rules,
    },
  },
];
