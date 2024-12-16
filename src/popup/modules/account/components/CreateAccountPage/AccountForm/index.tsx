import type * as nt from '@broxus/ever-wallet-wasm'
import * as React from 'react'
import { useIntl } from 'react-intl'
import { useNavigate } from 'react-router'
import { Controller, useForm } from 'react-hook-form'
import { observer } from 'mobx-react-lite'

import { Button, Card, Container, Content, Footer, Form, FormControl, Header, Icon, Input, Navbar, RadioButton, useResolve } from '@app/popup/modules/shared'
import { FooterAction } from '@app/popup/modules/shared/components/layout/Footer/FooterAction'
import { AccountFormViewModel } from '@app/popup/modules/account/components/CreateAccountPage/AccountForm/AccountFormViewModel'
import { CONTRACT_TYPE_NAMES, DEFAULT_MS_WALLET_TYPE, DEFAULT_WALLET_TYPE } from '@app/shared'

import styles from './index.module.scss'


export interface AccountFormValue {
    name: string;
    contractType: nt.ContractType;
}

export const AccountForm: React.FC = observer(() => {
    const intl = useIntl()
    const navigate = useNavigate()
    const vm = useResolve(AccountFormViewModel)

    const [deprecatedVisible, setDeprecatedVisible] = React.useState(false)

    const available = React.useMemo(
        () => new Set([
            ...vm.defaultContracts.map(item => item.type),
            ...vm.otherContracts.map(item => item.type),
        ]),
        [vm.defaultContracts, vm.otherContracts],
    )

    const { register, handleSubmit, formState, control } = useForm<AccountFormValue>({
        defaultValues: {
            name: vm.defaultAccountName,
            // eslint-disable-next-line no-nested-ternary
            contractType: available.has(DEFAULT_WALLET_TYPE)
                ? DEFAULT_WALLET_TYPE
                : available.has(DEFAULT_MS_WALLET_TYPE)
                    ? DEFAULT_MS_WALLET_TYPE
                    : undefined,
        },
    })

    return (
        <Container>
            <Header>
                <Navbar back={() => navigate(-1)}>
                    {intl.formatMessage({ id: 'NEW_ACCOUNT' })}
                </Navbar>
            </Header>
            <Content className={styles.content}>
                <Form
                    id="create-account-form"
                    onSubmit={handleSubmit(e => {
                        vm.onSubmit(e.contractType, e.name)
                    })}
                >
                    <FormControl label={intl.formatMessage({ id: 'ACCOUNT_NAME' })}>
                        <Input
                            autoFocus
                            size="xs"
                            type="text"
                            {...register('name')}
                        />
                    </FormControl>

                    {vm.defaultContracts.length > 0 && (
                        <Card size="s" bg="layer-1" className={styles.card}>
                            {vm.defaultContracts.map(item => (
                                <Controller
                                    key={item.type}
                                    name="contractType"
                                    control={control}
                                    rules={{ required: true }}
                                    render={({ field }) => (
                                        <RadioButton<nt.ContractType>
                                            name={field.name}
                                            value={item.type}
                                            checked={item.type === field.value}
                                            onChange={field.onChange}
                                            labelPosition="before"
                                            className={styles.item}
                                        >
                                            <div className={styles.title}>
                                                {CONTRACT_TYPE_NAMES[item.type]}
                                            </div>
                                            <div className={styles.desc}>
                                                {intl.formatMessage({ id: item.description })}
                                            </div>
                                        </RadioButton>
                                    )}
                                />
                            ))}
                        </Card>
                    )}

                    {vm.otherContracts.length > 0 && (
                        <>
                            <button
                                type="button"
                                onClick={() => setDeprecatedVisible(!deprecatedVisible)}
                                className={styles.toggler}
                            >
                                <div className={styles.title}>
                                    {intl.formatMessage({ id: 'DEPRECATED_TOGGLER_TITLE' })}
                                    <Icon icon={deprecatedVisible ? 'chevronUp' : 'chevronDown'} />
                                </div>
                                <div className={styles.desc}>
                                    {intl.formatMessage({ id: 'DEPRECATED_TOGGLER_DESC' })}
                                </div>
                            </button>

                            {deprecatedVisible && (
                                <Card size="s" bg="layer-1" className={styles.card}>
                                    {vm.otherContracts.map(item => (
                                        <Controller
                                            key={item.type}
                                            name="contractType"
                                            control={control}
                                            rules={{ required: true }}
                                            render={({ field }) => (
                                                <RadioButton<nt.ContractType>
                                                    name={field.name}
                                                    value={item.type}
                                                    checked={item.type === field.value}
                                                    onChange={field.onChange}
                                                    labelPosition="before"
                                                    className={styles.item}
                                                >
                                                    <div className={styles.title}>
                                                        {CONTRACT_TYPE_NAMES[item.type]}
                                                    </div>
                                                    <div className={styles.desc}>
                                                        {intl.formatMessage({ id: item.description })}
                                                    </div>
                                                </RadioButton>
                                            )}
                                        />
                                    ))}
                                </Card>
                            )}
                        </>
                    )}
                </Form>
            </Content>

            <Footer layer>
                <FooterAction
                    buttons={[
                        <Button
                            key="add"
                            design="accent"
                            type="submit"
                            form="create-account-form"
                            disabled={!formState.isValid}
                            loading={vm.loading}
                        >
                            {intl.formatMessage({ id: 'ADD_ACCOUNT' })}
                        </Button>,
                    ]}
                />
            </Footer>
        </Container>
    )
})
