import { memo, useCallback, useMemo, useState } from 'react'
import { useIntl } from 'react-intl'
import copy from 'copy-to-clipboard'
import classNames from 'classnames'
import { useNavigate } from 'react-router'

import { Button, Space, useResolve } from '@app/popup/modules/shared'
import { Icons } from '@app/popup/icons'

import s from './SaveSeed.module.scss'
import { NavigationBar } from '../../components/NavigationBar'
import { NewAccountStore } from '../../modules/NewAccount/NewAccountStore'
import { capitalizeFirstLetter } from '../../utils/capitalizeFirstLetter'
import { appRoutes } from '../../appRoutes'

export const SaveSeed = memo((): JSX.Element => {
    const { seed } = useResolve(NewAccountStore)

    const intl = useIntl()
    const [copied, setCopied] = useState(false)
    const words = useMemo(() => seed.phrase.split(' '), [seed])
    const navigate = useNavigate()

    const handleCopy = useCallback(() => {
        copy(seed.phrase)
        setCopied(true)
    }, [seed])

    const handleCheckPhrase = useCallback(() => {
        navigate(`${appRoutes.newAccount.path}/${appRoutes.checkSeed.path}`)
    }, [appRoutes])

    // TODO: check
    // const handleEnterPassword = useCallback(() => {
    //     navigate(`${appRoutes.newAccount.path}/${appRoutes.checkSeed.path}`)
    // }, [])

    const handleBack = useCallback(() => {
        navigate(appRoutes.welcome.path)
    }, [appRoutes])


    return (
        <div className={s.saveSeed}>
            <div className={s.container}>
                <div>
                    <div className={s.header}>
                        <Space direction="column" gap="l">
                            <h2 className={s.title}>
                                {intl.formatMessage({ id: 'SAVE_THE_SEED_PHRASE' })}
                            </h2>
                            <p className={s.text}>
                                {intl.formatMessage({ id: 'SAVE_THE_SEED_PHRASE_NOTE' })}
                            </p>
                        </Space>
                    </div>
                    <Space direction="column" gap="s">
                        <div>
                            <ol className={s.seedList}>
                                {words?.map((word: string, i: number) => (
                                    <li key={`${word}_${i.toString()}`}>
                                        <div>
                                            <span>{i < 9 ? `0${i + 1}` : i + 1}</span>
                                            {capitalizeFirstLetter(word)}
                                        </div>
                                    </li>
                                ))}
                            </ol>
                        </div>
                        <div className={s.frameCopy}>
                            <div>
                                {!copied ? (
                                    <Button className={classNames(s.copyButton)} design="ghost" onClick={handleCopy}>
                                        <span>
                                            {intl.formatMessage({ id: 'COPY_ALL_WORDS_BTN_TEXT' })}
                                        </span>
                                        <i>{Icons.copy}</i>
                                    </Button>
                                ) : (
                                    <div className={s.copyConfirm}>
                                        <span>
                                            {intl.formatMessage({ id: 'COPIED_TOOLTIP' })}
                                        </span>
                                        <i>{Icons.checkedGreen}</i>
                                    </div>
                                )}
                            </div>
                        </div>
                    </Space>
                </div>
                <NavigationBar
                    onNext={handleCheckPhrase}
                    onBack={handleBack}
                />
            </div>
        </div>
    )
})
