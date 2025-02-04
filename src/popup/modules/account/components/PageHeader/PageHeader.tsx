import { memo, PropsWithChildren, ReactNode } from 'react'

import styles from './PageHeader.module.scss'

type Props = PropsWithChildren<{
    label?: ReactNode;
}>

export const PageHeader = memo(({ label, children }: Props): JSX.Element => (
    <div className={styles.header}>
        {label && (
            <div className={styles.label}>{label}</div>
        )}
        <div className={styles.content}>{children}</div>
    </div>
))
