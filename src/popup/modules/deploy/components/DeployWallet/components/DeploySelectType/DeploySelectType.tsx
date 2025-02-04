import { memo, useMemo } from 'react'
import { useIntl } from 'react-intl'

import { Card, Container, Content, Icon, Space } from '@app/popup/modules/shared'
import { Icons } from '@app/popup/icons'
import { SlidingPanelHeader } from '@app/popup/modules/shared/components/SlidingPanel/SlidingPanelHeader'

import { WalletType } from '../../models'
import styles from './DeploySelectType.module.scss'

interface OptionType {
    value: WalletType;
    label: string;
    icon: keyof typeof Icons;
    description: string;
}

interface Props {
    onChange(value: WalletType): void;
    onNext(): void;
    onClose(): void;
}

export const DeploySelectType = memo(({ onChange, onNext, onClose }: Props): JSX.Element | null => {
    const intl = useIntl()

    const walletTypesOptions = useMemo<OptionType[]>(
        () => [
            {
                label: intl.formatMessage({ id: 'DEPLOY_WALLET_SELECT_WALLET_STANDARD' }),
                value: WalletType.Standard,
                description: intl.formatMessage({ id: 'DEPLOY_WALLET_SELECT_WALLET_STANDARD_DESCRIPTION' }),
                icon: 'wallet',
            },
            {
                label: intl.formatMessage({ id: 'DEPLOY_WALLET_SELECT_WALLET_MULTISIG' }),
                value: WalletType.Multisig,
                description: intl.formatMessage({ id: 'DEPLOY_WALLET_SELECT_WALLET_MULTISIG_DESCRIPTION' }),
                icon: 'users',
            },
        ],
        [],
    )

    return (
        <>
            <SlidingPanelHeader
                title={intl.formatMessage({ id: 'DEPLOY_WALLET_SELECT_TYPE_HEADER' })}
                onClose={onClose}
            />
            <Container>
                <Content className={styles.content}>
                    {walletTypesOptions.map((option) => (
                        <Card
                            size="s"
                            tabIndex={0}
                            role="button"
                            className={styles.pane}
                            onClick={() => {
                                onChange(option.value)
                                onNext()
                            }}
                        >
                            <Icon icon={option.icon} width={24} height={24} />
                            <Space direction="column" gap="xs">
                                <span className={styles.label}>{option.label}</span>
                                <span className={styles.description}>{option.description}</span>
                            </Space>
                        </Card>
                    ))}
                </Content>
            </Container>
        </>
    )
})
