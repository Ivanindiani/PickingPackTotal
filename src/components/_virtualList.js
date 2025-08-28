import { memo, useEffect, useMemo, useState, useCallback, useImperativeHandle, forwardRef } from "react";
import { Dimensions, StyleSheet, Text, View } from "react-native";
import {
    RecyclerListView,
    DataProvider,
    LayoutProvider,
} from 'recyclerlistview';
import _ from 'lodash';

const { width, height: screenHeight } = Dimensions.get('window');

const createDataProvider = () => {
    return new DataProvider((r1, r2) => r1 !== r2);
}

const ITEMS_VIEW = 15;

const ListaPerform = forwardRef(({
    items = [], 
    renderItems, 
    heightRemove = null, 
    refreshGet, 
    height = 120, 
    refreshControl = null, 
    forceHeight = false, 
    header = '', 
    ListEmptyComponent = <Text>Nada por aquí</Text>,
    scrollPrincipal = null
}, ref) => {
    const [visibleItems, setVisibleItems] = useState(items.slice(0, ITEMS_VIEW));
    const [loading, setLoading] = useState(0)
    
    useEffect(() => {
        if (items?.length) {
            setVisibleItems(items.slice(0, ITEMS_VIEW));
        } else {
            setVisibleItems([]);
        }
    }, [items]);

    const dataProvider = useMemo(() => 
        createDataProvider().cloneWithRows(visibleItems), 
        [visibleItems, renderItems]
    );

    // IMPORTANTE: Mueve el LayoutProvider fuera del render para evitar recrearlo
    const layoutProvider = useMemo(() => {
        return new LayoutProvider(
            index => 0,
            (type, dim) => {
                dim.width = width;
                dim.height = height;
            }
        );
    }, [height]);

    const loadMore = useCallback((size) => {
        if (loading > 0 || loading === size || visibleItems.length >= items.length) return;
        setLoading(size);
        console.log("Cargando más items...", visibleItems.length, loading, size);
        const newVisibleItems = items.slice(0, visibleItems.length + ITEMS_VIEW);
        setVisibleItems(newVisibleItems);
        
        setTimeout(() => {
            setLoading(0);
        }, 500);
    }, [loading, visibleItems, items]);


    useImperativeHandle(ref, () => ({
        handleScroll: (ev) => onScroll(ev)
    }));

    const onScroll = (event) =>{
        const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
        const isCloseToBottom = contentOffset.y + layoutMeasurement.height >= contentSize.height - (height*3);
        //console.log("Scroll position:", contentOffset.y, "Content size:", contentSize.height, "Close to bottom:", isCloseToBottom);

        //console.log("Scroll: ", isCloseToBottom, contentSize.height-heightRemove, contentSize.height, contentOffset.y, layoutMeasurement.height, heightRemove, visibleItems.length*height)
        if(isCloseToBottom) loadMore(contentSize.height);

        return true;
    
    };

    return (
        <View 
            style={{ marginTop: 5, flex: 2, height: visibleItems.length > 0 ? (visibleItems.length * height):100, minHeight: 100 }}
        >
            {!items.length ? ListEmptyComponent : (
                <RecyclerListView
                    layoutProvider={layoutProvider}
                    dataProvider={dataProvider}
                    rowRenderer={(type, data, index) => renderItems(data, index)}
                    scrollViewProps={{
                        refreshControl,
                        scrollEnabled: !scrollPrincipal ? true:false,
                        nestedScrollEnabled: true
                    }}
                    forceNonDeterministicRendering={forceHeight}
                    canChangeSize={scrollPrincipal ? true:false}
                    extendedState={renderItems}
                    //onEndReached={loadMore}
                    //onEndReachedThreshold={0.5} // Cambiado a valor relativo (0-1)
                    //onEndReachedThresholdRelative={0.5}
                    //onVisibleIndicesChanged={(a,b) => console.log(a,b)}
                    renderAheadOffset={height*7} // Mejora rendimiento
                    initialRenderIndex={0}
                    optimizeForInsertDeleteItems={true}
                    //renderFooter={() => <View style={{height: 100, width: width, backgroundColor: 'blue'}} />}
                    onScroll={(e) => scrollPrincipal ? null:onScroll(e)}
                />
            )}
        </View>
    )
})

const arePropsEqual = (prevProps, nextProps) => {
    if (_.isEqual(prevProps.items, nextProps.items) && 
        _.isEqual(prevProps.renderItems, nextProps.renderItems) &&
        prevProps.heightRemove === nextProps.heightRemove && 
        prevProps.height === nextProps.height) {
        return true;
    }
    return false;
}

export default memo(ListaPerform, arePropsEqual);