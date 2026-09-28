import { shortcutGroups } from './shortcuts'
import styles from './ShortcutList.module.css'

export function ShortcutList() {
  return (
    <div className={styles.groups}>
      {shortcutGroups.map((g) => (
        <section key={g.title}>
          <h3>{g.title}</h3>
          <dl>
            {g.keys.map(([key, what]) => (
              <div key={key}>
                <dt>
                  {key.split(' / ').map((k, i) => (
                    <span key={k}>
                      {i > 0 && ' / '}
                      <kbd>{k}</kbd>
                    </span>
                  ))}
                </dt>
                <dd>{what}</dd>
              </div>
            ))}
          </dl>
        </section>
      ))}
    </div>
  )
}
