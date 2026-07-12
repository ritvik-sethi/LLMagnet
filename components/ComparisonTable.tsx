'use client';

import styles from '../styles/MarketingExtras.module.scss';

const ROWS: { feature: string; llmagnet: string; openai: string; claude: string }[] = [
  {
    feature: 'Built for newsroom article editing',
    llmagnet: 'Yes — draft → score → live → advice → polish → rivals',
    openai: 'Blank chat',
    claude: 'Blank chat',
  },
  {
    feature: 'Citeability score for answer engines',
    llmagnet: 'Live probe + E-E-A-T matrix',
    openai: 'No product score',
    claude: 'No product score (rarely cites)',
  },
  {
    feature: 'Live news / X / Reddit pressure-test',
    llmagnet: 'Built into Live check',
    openai: 'Needs custom tooling',
    claude: 'Needs custom tooling',
  },
  {
    feature: 'Context carries across edits',
    llmagnet: 'Score + live + advice feed the next prompt',
    openai: 'Manual re-paste',
    claude: 'Manual re-paste',
  },
  {
    feature: 'Rival coverage gap analysis',
    llmagnet: 'Scrapes other outlets vs your draft',
    openai: 'DIY research',
    claude: 'DIY research',
  },
];

export default function ComparisonTable() {
  return (
    <div className={styles.comparison}>
      <p className={styles.honest}>
        OpenAI and Claude are excellent general models. LLMagnet is a specialized editorial product
        for making news articles more citeable — often powered by those same models under the hood.
      </p>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th scope="col">Capability</th>
              <th scope="col" className={styles.colUs}>
                LLMagnet
              </th>
              <th scope="col">OpenAI ChatGPT</th>
              <th scope="col">Claude</th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row) => (
              <tr key={row.feature}>
                <th scope="row">{row.feature}</th>
                <td className={styles.colUs}>{row.llmagnet}</td>
                <td>{row.openai}</td>
                <td>{row.claude}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
