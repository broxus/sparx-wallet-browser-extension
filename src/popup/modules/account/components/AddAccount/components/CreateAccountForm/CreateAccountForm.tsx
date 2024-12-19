import type * as nt from '@broxus/ever-wallet-wasm'
import { CSSProperties, memo, useMemo, useState } from 'react'
import { useIntl } from 'react-intl'
import { Controller, useForm } from 'react-hook-form'

import {
    Button,
    Card,
    Container,
    Content,
    ErrorMessage,
    Footer,
    Form,
    FormControl,
    Header,
    Icon,
    Input,
    Navbar,
    RadioButton,
    Switch,
    Tooltip,
} from '@app/popup/modules/shared'
import {
    CONTRACT_TYPE_NAMES,
    DEFAULT_MS_WALLET_TYPE,
    DEFAULT_WALLET_TYPE,
    MS_INFO_URL,
    OTHER_WALLET_CONTRACTS,
} from '@app/shared'
import { Alert } from '@app/popup/modules/shared/components/Alert/Alert'
import { FooterAction } from '@app/popup/modules/shared/components/layout/Footer/FooterAction'

import styles from './CreateAccountForm.module.scss'

interface Props {
    availableContracts: nt.ContractType[];
    excludedContracts?: nt.ContractType[];
    defaultAccountName: string;
    error?: string;
    loading?: boolean;
    onSubmit(value: CreateAccountFormValue): void;
}

export interface CreateAccountFormValue {
    name: string;
    contractType: nt.ContractType;
}

const tooltipStyle: CSSProperties = {
    width: 244,
}

export const CreateAccountForm = memo((props: Props): JSX.Element => {
    const {
        availableContracts,
        excludedContracts,
        defaultAccountName,
        error,
        loading,
        onSubmit,
    } = props
    const intl = useIntl()
    const [extended, setExtended] = useState(false)

    const excluded = useMemo(
        () => new Set(excludedContracts),
        [excludedContracts],
    )
    const available = useMemo(
        () => new Set(availableContracts),
        [availableContracts],
    )

    const { register, handleSubmit, formState, control } = useForm<CreateAccountFormValue>({
        defaultValues: {
            name: defaultAccountName,
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
                <Navbar back="..">
                    {intl.formatMessage({ id: 'ADD_ACCOUNT_PANEL_FLOW_CREATE_LABEL' })}
                </Navbar>
            </Header>

            <Content>
                <Form id="create-account-form" onSubmit={handleSubmit(onSubmit)}>
                    <FormControl label={intl.formatMessage({ id: 'ENTER_ACCOUNT_NAME_FIELD_PLACEHOLDER' })}>
                        <Input
                            autoFocus
                            size="xs"
                            type="text"
                            {...register('name')}
                        />
                    </FormControl>

                    <Card bg="layer-1" size="xs" className={styles.card}>
                        <Controller
                            name="contractType"
                            control={control}
                            rules={{ required: true }}
                            render={({ field }) => (
                                <RadioButton<nt.ContractType>
                                    labelPosition="before"
                                    className={styles.item}
                                    disabled={!available.has(DEFAULT_WALLET_TYPE)}
                                    checked={DEFAULT_WALLET_TYPE === field.value}
                                    value={DEFAULT_WALLET_TYPE}
                                    name={field.name}
                                    onChange={field.onChange}
                                >
                                    <div className={styles.name}>
                                        {intl.formatMessage({ id: 'CREATE_ACCOUNT_DEFAULT' })}
                                    </div>
                                    <div className={styles.desc}>
                                        {intl.formatMessage({ id: 'CREATE_ACCOUNT_DEFAULT_HINT' })}
                                    </div>
                                </RadioButton>
                            )}
                        />
                        <Controller
                            name="contractType"
                            control={control}
                            rules={{ required: true }}
                            render={({ field }) => (
                                <RadioButton<nt.ContractType>
                                    labelPosition="before"
                                    className={styles.item}
                                    disabled={!available.has(DEFAULT_MS_WALLET_TYPE)}
                                    checked={DEFAULT_MS_WALLET_TYPE === field.value}
                                    value={DEFAULT_MS_WALLET_TYPE}
                                    name={field.name}
                                    onChange={field.onChange}
                                >
                                    <div className={styles.name}>
                                        {intl.formatMessage({ id: 'CREATE_ACCOUNT_MULTISIGNATURE' })}
                                    </div>
                                    <div className={styles.desc}>
                                        <a href={MS_INFO_URL} target="_blank" rel="nofollow noopener noreferrer">
                                            {intl.formatMessage({ id: 'CREATE_ACCOUNT_MULTISIGNATURE_LEARN_MORE' })}
                                        </a>
                                    </div>
                                </RadioButton>
                            )}
                        />
                    </Card>

                    {!available.has(DEFAULT_WALLET_TYPE) && !available.has(DEFAULT_MS_WALLET_TYPE) && (
                        <Alert
                            showIcon={false}
                            type="warning"
                            body={intl.formatMessage({ id: 'CREATE_ACCOUNT_WALLET_TYPE_ALERT' })}
                        />
                    )}

                    <Switch labelPosition="before" checked={extended} onChange={setExtended}>
                        <div className={styles.switch}>
                            {intl.formatMessage({ id: 'CREATE_ACCOUNT_OPEN_ALL' })}
                            <Icon icon="info" id="alert-tooltip" />
                        </div>
                        <Tooltip design="primary" anchorSelect="#alert-tooltip" style={tooltipStyle}>
                            {intl.formatMessage({ id: 'CREATE_ACCOUNT_WALLET_DEPRECATED_HINT' })}
                        </Tooltip>
                    </Switch>

                    {extended && (
                        <Card bg="layer-1" size="xs" className={styles.card}>
                            {OTHER_WALLET_CONTRACTS.map(({ type, description }) => {
                                if (excluded.has(type)) return null

                                return (
                                    <Controller
                                        name="contractType"
                                        key={type}
                                        control={control}
                                        rules={{ required: true }}
                                        render={({ field }) => (
                                            <RadioButton<nt.ContractType>
                                                labelPosition="before"
                                                className={styles.item}
                                                disabled={!available.has(type)}
                                                checked={type === field.value}
                                                value={type}
                                                name={field.name}
                                                onChange={field.onChange}
                                            >
                                                <div className={styles.name}>
                                                    {CONTRACT_TYPE_NAMES[type]}
                                                </div>
                                                <div className={styles.desc}>
                                                    {intl.formatMessage({ id: description })}
                                                </div>
                                            </RadioButton>
                                        )}
                                    />
                                )
                            })}
                        </Card>
                    )}

                    <ErrorMessage>{error}</ErrorMessage>
                </Form>
            </Content>

            <Footer layer>
                <FooterAction
                    buttons={[
                        <Button
                            design="accent"
                            type="submit"
                            form="create-account-form"
                            disabled={!formState.isValid}
                            loading={loading}
                        >
                            {intl.formatMessage({ id: 'ADD_ACCOUNT_BTN_TEXT' })}
                        </Button>,
                    ]}
                />
            </Footer>
        </Container>
    )
})
