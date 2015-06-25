/*
|--item
	|-- price {Number} - formula ? wtf dude what price formula ? 
	|-- experience - formula ? (gain selon clics, ressources produites depuis création/début, production d'autres items)
	|-- expPattern {ExpPattern}
	|-- level
	|-- sprite {Sprite}
	|-- behaviours []
	|-- resourcesGenerated
	|-- timesClicked
	|-- tempResources
	|-- perSecondBase
	|-- flatBonus
	|-- scaleBonus

|-- ExpPattern
		
|-- Behaviour
	|-- buff
		|-- effect
		|-- buffMap
	|-- clickable {boolean}
		|-- delay {Number}
	|-- periodic
		|-- timer
	|-- instant


|-- Model.ItemEffect
	|-o add( itemEffect ) : this
	|-o set( attr, value ) : this
	|
	|-- flatPerSecondBonus
	|-- scalePerSecondBonus
	|-- flatPerClickBonus
	|-- scalePerClickBonus

|-- Model.Leveling
	|-o at( level ) : ItemEffect[]
	|-o at( level, itemEffect ) : this
*/