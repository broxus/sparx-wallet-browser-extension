import { useEffect, useState } from 'react'
import { observer } from 'mobx-react-lite'
import { Controller, useForm } from 'react-hook-form'
import { useIntl } from 'react-intl'

import { Icons } from '@app/popup/icons'
import { amountPattern, MULTISIG_UNCONFIRMED_LIMIT } from '@app/shared'
import { AmountInput, AssetSelect, Button, Checkbox, Container, Content, ErrorMessage, Footer, Form, FormControl, Header, Input, Navbar, UserInfo, useViewModel } from '@app/popup/modules/shared'
import { ContactInput } from '@app/popup/modules/contacts'

import { MessageFormData, PrepareMessageViewModel } from './PrepareMessageViewModel'
import styles from './PrepareMessage.module.scss'

export const PrepareMessage = observer((): JSX.Element => {
    const vm = useViewModel(PrepareMessageViewModel, (model) => {
        model.setFormError = (...args) => setError(...args)
    })
    const form = useForm<MessageFormData>({
        defaultValues: {
            recipient: vm.transfer.messageParams?.recipient ?? vm.transfer.initialAddress,
            amount: vm.transfer.messageParams?.originalAmount ?? '',
            comment: vm.transfer.messageParams?.comment ?? '',
            notify: vm.transfer.messageParams?.notify ?? false,
        },
    })

    const [isDens, setIsDens] = useState(() => vm.isDens(form.getValues().recipient))
    const intl = useIntl()
    const { register, handleSubmit, formState, control, watch, setError } = form

    useEffect(() => {
        const { unsubscribe } = watch(({ recipient }, { name }) => {
            if (name !== 'recipient') return
            setIsDens(vm.isDens(recipient))
        })

        return unsubscribe
    }, [watch])

    return (
        <Container>
            <Header>
                <Navbar close="window">
                    <UserInfo account={vm.account} compact />
                </Navbar>
            </Header>

            <Content>
                <h2>{intl.formatMessage({ id: 'SEND_MESSAGE_PANEL_FROM_HEADER' })}</h2>

                <Form id="send" onSubmit={handleSubmit(vm.submit)}>
                    <FormControl label={intl.formatMessage({ id: 'ASSETS_INPUT_LABEL' })}>
                        <AssetSelect
                            value={vm.asset}
                            address={vm.account.tonWallet.address}
                            onChange={vm.onChangeAsset}
                        />
                    </FormControl>

                    <FormControl
                        label={intl.formatMessage({ id: 'FORM_RECEIVER_ADDRESS_LABEL' })}
                        invalid={!!formState.errors.recipient}
                    >
                        <Controller
                            name="recipient"
                            control={control}
                            rules={{
                                required: true,
                                validate: vm.validateAddress,
                            }}
                            render={({ field }) => (
                                <ContactInput
                                    {...field}
                                    autoFocus
                                    type="address"
                                />
                            )}
                        />

                        <ErrorMessage>
                            {formState.errors.recipient?.type === 'required' && intl.formatMessage({ id: 'ERROR_FIELD_IS_REQUIRED' })}
                            {formState.errors.recipient?.type === 'validate' && intl.formatMessage({ id: 'ERROR_INVALID_RECIPIENT' })}
                            {formState.errors.recipient?.type === 'pattern' && intl.formatMessage({ id: 'ERROR_INVALID_FORMAT' })}
                            {formState.errors.recipient?.type === 'invalid' && intl.formatMessage({ id: 'ERROR_INVALID_ADDRESS' })}
                        </ErrorMessage>
                    </FormControl>

                    <Controller
                        name="amount"
                        control={control}
                        rules={{
                            required: true,
                            pattern: vm.decimals != null ? amountPattern(vm.decimals) : /^\d+$/,
                            validate: {
                                invalidAmount: vm.validateAmount,
                                insufficientBalance: vm.validateBalance,
                            },
                        }}
                        render={({ field }) => (
                            <AmountInput
                                {...field}
                                invalid={!!formState.errors.amount}
                                address={vm.account.tonWallet.address}
                                asset={vm.asset}
                                error={formState.errors.amount && (
                                    <ErrorMessage>
                                        {formState.errors.amount.type === 'required' && intl.formatMessage({ id: 'ERROR_FIELD_IS_REQUIRED' })}
                                        {formState.errors.amount.type === 'invalidAmount' && intl.formatMessage({ id: 'ERROR_INVALID_AMOUNT' })}
                                        {formState.errors.amount.type === 'insufficientBalance' && intl.formatMessage({ id: 'ERROR_INSUFFICIENT_BALANCE' })}
                                        {formState.errors.amount.type === 'pattern' && intl.formatMessage({ id: 'ERROR_INVALID_FORMAT' })}
                                    </ErrorMessage>
                                )}
                            />
                        )}
                    />

                    {vm.asset.type === 'token_wallet' && (
                        <FormControl>
                            <Checkbox {...register('notify')} labelPosition="after">
                                {intl.formatMessage({ id: 'SEND_MESSAGE_NOTIFY_CHECKBOX_LABEL' })}
                            </Checkbox>
                        </FormControl>
                    )}

                    {!vm.commentVisible && (
                        <Button
                            design="ghost"
                            size="s"
                            className={styles.add}
                            onClick={vm.showComment}
                        >
                            {Icons.plus}
                            {intl.formatMessage({ id: 'ADD_COMMENT' })}
                        </Button>
                    )}

                    {vm.commentVisible && (
                        <FormControl label={intl.formatMessage({ id: 'SEND_MESSAGE_COMMENT_FIELD_PLACEHOLDER' })}>
                            <Input
                                type="text"
                                {...register('comment')}
                            />
                        </FormControl>
                    )}
                </Form>
            </Content>

            <Footer className={styles.footer}>
                <div className={styles.footerInfo}>
                    {formState.touchedFields.recipient && isDens && (
                        <div className={styles.footerHint}>
                            {intl.formatMessage({ id: 'SEND_MESSAGE_DENS_RECIPIENT_HINT' })}
                        </div>
                    )}
                    {vm.isMultisigLimit && (
                        <ErrorMessage>
                            {intl.formatMessage(
                                { id: 'ERROR_MULTISIG_LIMIT' },
                                { count: MULTISIG_UNCONFIRMED_LIMIT },
                            )}
                        </ErrorMessage>
                    )}
                </div>
                <Button form="send" type="submit" disabled={!vm.key || vm.isMultisigLimit}>
                    {intl.formatMessage({ id: 'NEXT_BTN_TEXT' })}
                </Button>
            </Footer>
        </Container>
    )
})
