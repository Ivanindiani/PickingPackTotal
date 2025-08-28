import { FAB, Stack } from "@react-native-material/core";
import { forwardRef, memo, useImperativeHandle, useState } from "react";
import { Dimensions } from "react-native";

import Entypo from "react-native-vector-icons/Entypo";

const {height: screenHeight} = Dimensions.get('window');

const availableScroll = screenHeight*0.75;

const FabScrollTop = forwardRef(({
    scrollPrincipal
}, ref) => {
    const [show, setShow] = useState(false);


    useImperativeHandle(ref, () => ({
        handleScroll: (event) =>{
            const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
            const enabled = contentOffset.y + layoutMeasurement.height >= (contentSize.height*0.15);
            
            if(contentOffset.y > availableScroll && !show){
                setShow(true);
            } else if(contentOffset.y < availableScroll && show) {
                setShow(false);
            }
        }
    }));

    if(!show) return ''

    return <FAB size="mini" 
                style={{position: 'absolute', bottom: 15, left: 0, margin: 15}}
                icon={props => <Entypo name="arrow-up" {...props} />} 
                onPress={() => scrollPrincipal.current?.scrollTo({y: 20, animated: true})}/>
});

const isEqual = (prev, next) => {
    return prev.scrollPrincipal !== next.scrollPrincipal;
};

export default memo(FabScrollTop, isEqual);