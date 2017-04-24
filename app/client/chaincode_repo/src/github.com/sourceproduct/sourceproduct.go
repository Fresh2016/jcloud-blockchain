package main

import (
	"errors"
	"github.com/hyperledger/fabric/core/chaincode/shim"
	"fmt"
)

// SourceProductChainCode example simple Chaincode implementation
type SourceProductChainCode struct {
}

// Init takes a string and int. These are stored as a key/value pair in the state
func (t *SourceProductChainCode) Init(stub shim.ChaincodeStubInterface, function string, args []string) ([]byte, error) {
	return nil, nil
}

// Invoke is a no-op
func (t *SourceProductChainCode) Invoke(stub shim.ChaincodeStubInterface, function string, args []string) ([]byte, error) {
	var key string // Event entity
	var value string // State of event
	var err error

	if len(args) != 2 {
		return nil, errors.New("Incorrect number of arguments. Expecting 2")
	}

	key = args[0]
	value = args[1]

	// Write the event state back to the ledger
	err = stub.PutState(key, []byte(value))
	if err != nil {
		return nil, err
	}

	return nil, nil
}

// Query callback representing the query of a chaincode
func (t *SourceProductChainCode) Query(stub shim.ChaincodeStubInterface, function string, args []string) ([]byte, error) {
	if function != "query" {
		return nil, errors.New("Invalid query function name. Expecting \"query\"")
	}
	var key string // Entity
	var resBytes []byte
	var err error

	if len(args) != 1 {
		return nil, errors.New("Incorrect number of arguments. Expecting 2")
	}

	key = args[0]

	// Write the state to the ledger - this put is illegal within Run
	resBytes, err = stub.GetState(key)
	if err != nil {
		jsonResp := "{\"Error\":\"Cannot put state within chaincode query\"}"
		return nil, errors.New(jsonResp)
	}

	return resBytes, nil
}

func main() {
	err := shim.Start(new(SourceProductChainCode))
	if err != nil {
		fmt.Printf("Error starting chaincode: %s", err)
	}
}
