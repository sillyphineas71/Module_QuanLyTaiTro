import { Box, Button } from '@primer/react';
import React from 'react';
import { appConst } from '../../AppConst';
interface IBrandLogoProps {
    height?: number
}
const BrandLogo = (props: IBrandLogoProps) => {
    return (
        <Box>
            <Button variant='invisible' sx={{
                height: "auto"
            }}>
                <img src={appConst.appURLLogo.toString()}
                    alt='Logo'
                    style={{
                        height: `${props.height ?? 48}px`
                    }}
                />
            </Button>
        </Box>
    );
};

export default BrandLogo;