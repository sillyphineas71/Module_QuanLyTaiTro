import React from 'react';
import { Text } from "@primer/react"
import { TextProps } from '@primer/react/lib-esm';
export interface ITextProps extends TextProps {
    text: string
}
const MyText = (props: ITextProps) => {
    const { text, className, style, ...rest } = props;
    return (
        <Text style={style} className={className} {...rest}>
            {text}
        </Text>
    );
};

export default MyText;