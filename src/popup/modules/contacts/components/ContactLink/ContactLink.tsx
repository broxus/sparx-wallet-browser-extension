import { observer } from 'mobx-react-lite'

import { convertAddress, convertPublicKey, isNativeAddress } from '@app/shared'
import { CopyButton, Icon, useResolve } from '@app/popup/modules/shared'
import { Contact, RawContact } from '@app/models'

import { ContactsStore } from '../../store'

import './ContactLink.scss'

interface Props {
    address: string;
    type: RawContact['type'];
    onOpen?(contact: RawContact): void;
    onAdd?(contact: RawContact): void;
}

export const ContactLink = observer(({ address, type, onOpen, onAdd }: Props): JSX.Element => {
    const { contacts } = useResolve(ContactsStore)
    const contact = contacts[address] as Contact | undefined
    const name = contact?.name ?? convertValue(type, address)

    return (
        <div className="contact-link">
            <button
                type="button"
                className="contact-link__name"
                title={address}
                onClick={() => onOpen?.(contact ?? { type, value: address })}
            >
                {contact && (
                    <Icon
                        icon="person" className="contact-link__name-icon" width={16}
                        height={16}
                    />
                )}
                <span className="contact-link__name-value">{name}</span>
            </button>
            {!contact && onAdd && (
                <button
                    type="button"
                    className="contact-link__btn"
                    onClick={() => onAdd({ type, value: address })}
                >
                    <Icon icon="addUser" width={16} height={16} />
                </button>
            )}
            <CopyButton text={address}>
                <button type="button" className="contact-link__btn">
                    <Icon icon="copy" width={16} height={16} />
                </button>
            </CopyButton>
        </div>
    )
})

function convertValue(type: RawContact['type'], value: string): string {
    if (type === 'public_key') {
        return convertPublicKey(value)
    }

    return isNativeAddress(value) ? convertAddress(value) : value
}
