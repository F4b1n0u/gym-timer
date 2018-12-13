import React from 'react'
import { StyleSheet, Dimensions, FlatList, View, Animated, Easing } from 'react-native'
import Color from 'color'

import Loop from './Loop'

const { width: windowWidth } = Dimensions.get('window')
class Sequence extends React.Component {
  constructor(props) {
    super(props)

    this._tailProgression = new Animated.Value(0)
    this._headProgression = new Animated.Value(props.timers.length) // TODO bug in the head
  }

  _keyExtractor = ({ id }) => `${id}`

  _renderTimer = ({ item: timer, index }) => (
    <Loop
      {...timer}
      width={15 / 100}
      loopRadius={3 / 10}
      xStartPosition={2 / 10}
      borderWidth={8 / 100}
      fillColor={Color(`#5A7AED`).hex()}
      borderColor={`#fff`}
      headProgression={this._headProgression}
      tailProgression={this._tailProgression}
      startsAt={index}
      endsAt={index + 1}
    />
  )

  render() {
    const {
      timers,
    } = this.props

    return (
      <View
        style={styles.sequence}
      >
        <FlatList
          ref={ ref => this._timersList = ref }
          data={timers}
          keyExtractor={this._keyExtractor}
          renderItem={this._renderTimer}
          CellRendererComponent={({ children, index, style, ...props }) => (
            <View
              style={[
                style,
                { 
                  zIndex: timers.length - index,
                }
              ]}
              index={index}
              {...props
            }>
              {children}
            </View>
          )}
          scrollEventThrottle={8}
        />
      </View>
    )
  }

  componentDidMount() {
    this._startTimerAnimation()
  }

  _startTimerAnimation = () => {
    const {
      timers,
    } = this.props
    
    const progression = this._tailProgression.__getValue()
    const {
      durations: {
        in: durationIn,
        loopIn: durationLoopIn,
        loopOut: durationLoopOut,
      },
      easings: {
        in: inEasing,
      }
    } = timers[Number(progression.toFixed(0))]

    Animated.sequence([
      Animated.timing(
        this._tailProgression,
        {
          toValue: progression + 1/3,
          duration: durationIn,
          useNativeDriver: true,
          easing: inEasing,
        },
      ),
      Animated.timing(
        this._tailProgression,
        {
          toValue: progression + 2/3,
          duration: durationLoopIn,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.linear),
        },
      ),
      Animated.timing(
        this._tailProgression,
        {
          toValue: progression + 1,
          duration: durationLoopOut,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.linear),
        },
      ),
    ]).start(() => {
      const {
        timers,
      } = this.props

      let progression = this._tailProgression.__getValue()
      const isReseting = progression >= timers.length

      if (isReseting) {
        // TODO check why they are not all reseseted properly
        this._timersList.scrollToItem({
          animated: true,
          item: timers[0]
        })
        Animated.timing(
          this._tailProgression,
          {
            toValue: 0,
            duration: 250,
            useNativeDriver: true,
            easing: Easing.inOut(Easing.ease),
          },
        ).start(this._startTimerAnimation)
        
      } else {
        progression = this._tailProgression.__getValue()
        const item = timers[Number(progression.toFixed(0))]
        setTimeout(() => {
          this._timersList.scrollToItem({
            animated: true,
            item
          })
        }, 100)

        this._startTimerAnimation()
      }
    })
  }
}

const styles = StyleSheet.create({
  sequence: {
    flexDirection: 'column',
    width: windowWidth,
  }
})

export default Sequence
