import type * as nt from '@broxus/ever-wallet-wasm'
import { useIntl } from 'react-intl'
import { memo } from 'react'

import { Icons } from '@app/popup/icons'
import { IconButton } from '@app/popup/modules/shared'

import { List } from '../List'
import styles from './SeedListItem.module.scss'

interface Props {
    keyEntry: nt.KeyStoreEntry;
    active: boolean;
    keys: number;
    onSelect(key: nt.KeyStoreEntry): void;
    onClick(key: nt.KeyStoreEntry): void;
}

export const SeedListItem = memo(({ keyEntry, active, keys, onClick, onSelect }: Props): JSX.Element => {
    const intl = useIntl()

    const addon = !active && (
        <IconButton
            className={`${styles.icon} tooltip-anchor-element`}
            design="ghost"
            size="xs"
            icon={Icons.check}
            onClick={() => onSelect(keyEntry)}
        />
    )

    return (
        <List.Item
            className={styles.item}
            active={active}
            name={keyEntry.name}
            info={intl.formatMessage({ id: 'PUBLIC_KEYS_PLURAL' }, { count: keys })}
            addon={addon}
            onClick={() => onClick(keyEntry)}
        />
    )
})
