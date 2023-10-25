import * as nt from '@broxus/ever-wallet-wasm'
import { memo, useCallback, useState } from 'react'
import classNames from 'classnames'
import { useIntl } from 'react-intl'

import { convertPublicKey } from '@app/shared'

import { Container, Content, Footer } from '../layout'
import { Button } from '../Button'
import { Icon } from '../Icon'
import { RadioButton } from '../RadioButton'
import { SlidingPanel } from '../SlidingPanel'
import styles from './KeySelect.module.scss'

interface Props {
    className?: string;
    appearance?: 'select' | 'button';
    value: nt.KeyStoreEntry;
    keyEntries?: nt.KeyStoreEntry[];
    onChange?(value: nt.KeyStoreEntry): void;
}

export const KeySelect = memo((props: Props): JSX.Element | null => {
    const {
        appearance = 'select',
        className,
        value,
        keyEntries,
        onChange,
    } = props
    const [active, setActive] = useState(false)
    const [selected, setSelected] = useState(value.publicKey)
    const intl = useIntl()

    const handleOpen = useCallback(() => {
        setActive(true)
        setSelected(value.publicKey)
    }, [value])
    const handleClose = useCallback(() => setActive(false), [])
    const handleSave = () => {
        const key = keyEntries?.find(({ publicKey }) => publicKey === selected)
        if (key) onChange?.(key)
        setActive(false)
    }

    if (!keyEntries || keyEntries.length < 2) return null

    return (
        <>
            <button
                type="button"
                className={classNames(styles.select, styles[`_appearance-${appearance}`], className)}
                onClick={handleOpen}
            >
                <span className={styles.name}>
                    {value.name || convertPublicKey(value.publicKey)}
                </span>
                <Icon icon="key" className={styles.icon} />
            </button>

            <SlidingPanel whiteBg active={active} onClose={handleClose}>
                <Container>
                    <Content>
                        <h2>{intl.formatMessage({ id: 'KEY_SELECT_HEADER' })}</h2>
                        <div className={styles.list}>
                            {keyEntries.map((key) => (
                                <RadioButton
                                    labelPosition="before"
                                    key={key.publicKey}
                                    className={styles.item}
                                    value={key.publicKey}
                                    checked={key.publicKey === selected}
                                    onChange={setSelected}
                                >
                                    {key.name || convertPublicKey(key.publicKey)}
                                </RadioButton>
                            ))}
                        </div>
                    </Content>
                    <Footer>
                        <Button onClick={handleSave}>
                            {intl.formatMessage({ id: 'SAVE_BTN_TEXT' })}
                        </Button>
                    </Footer>
                </Container>
            </SlidingPanel>
        </>
    )
})
