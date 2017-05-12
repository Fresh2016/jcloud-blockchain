/******************************************************************
Copyright IT People Corp. 2017 All Rights Reserved.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

                 http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

******************************************************************/

///////////////////////////////////////////////////////////////////////
// Author : IT People - Mohan - table API for v1.0
// Enable CouchDb as the database..
// Purpose: Explore the Hyperledger/fabric and understand
// how to write an chain code, application/chain code boundaries
// The code is not the best as it has just hammered out in a day or two
// Feedback and updates are appreciated
///////////////////////////////////////////////////////////////////////

package main

import (
	"errors"
	"fmt"
	"github.com/hyperledger/fabric/core/chaincode/shim"
)

//////////////////////////////////////////////////////////////////////////////////////////////////
// The recType is a mandatory attribute. The original app was written with a single table
// in mind. The only way to know how to process a record was the 70's style 80 column punch card
// which used a record type field. The array below holds a list of valid record types.
// This could be stored on a blockchain table or an application
//////////////////////////////////////////////////////////////////////////////////////////////////
//var recType = []string{"ARTINV", "USER", "BID", "AUCREQ", "POSTTRAN", "OPENAUC", "CLAUC", "XFER", "VERIFY"}

//////////////////////////////////////////////////////////////////////////////////////////////////
// The following array holds the list of tables that should be created
// The deploy/init deletes the tables and recreates them every time a deploy is invoked
//////////////////////////////////////////////////////////////////////////////////////////////////
var Objects = []string{"SkuTraceRecordObj", "SkuAuthenticationTraceRecordObj", "SkuBaseInfoObj", "SkuTransactionObj", "CertificationAccountInfoObj", "AccountInfoObj"}

/////////////////////////////////////////////////////////////////////////////////////////////////////
func GetNumberOfKeys(tname string) int {
	ObjectMap := map[string]int{
		"SkuTraceRecordObj":        4,
		"SkuAuthenticationTraceRecordObj":        4,
		"SkuBaseInfoObj":     1,
		"SkuTransactionObj":     4,
		"CertificationAccountInfoObj":     1,
		"AccountInfoObj":     1,
	}
	return ObjectMap[tname]
}


////////////////////////////////////////////////////////////////////////////
// Open a Ledgers if one does not exist
// These ledgers will be used to write /  read data
////////////////////////////////////////////////////////////////////////////
func InitObject(stub shim.ChaincodeStubInterface, objectType string, keys []string)  error {

	fmt.Println(">> Not Implemented Yet << Initializing Object : " , objectType, " Keys: ", keys)
	return nil
}

////////////////////////////////////////////////////////////////////////////
// Update the Object - Replace current data with replacement
// Register users into this table
////////////////////////////////////////////////////////////////////////////
func UpdateObject(stub shim.ChaincodeStubInterface, objectType string, keys []string, objectData []byte) error {

        // Check how many keys

        err := VerifyAtLeastOneKeyIsPresent(objectType, keys )
        if err != nil {
                return err
        }

	// Convert keys to  compound key
	compositeKey, _ := stub.CreateCompositeKey(objectType, keys)

	// Add Object JSON to state
	err = stub.PutState(compositeKey, objectData)
	if err != nil {
		fmt.Println("UpdateObject() : Error inserting Object into State Database %s", err)
		return err
	}

	return nil

}

////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Replaces the Entry in the Ledger
// The existing object is simply queried and the data contents is replaced with
// new content
////////////////////////////////////////////////////////////////////////////////////////////////////////////
func ReplaceObject(stub shim.ChaincodeStubInterface, objectType string, keys []string, objectData []byte) error {

        // Check how many keys

        err := VerifyAtLeastOneKeyIsPresent(objectType, keys )
        if err != nil {
                return err
        }

	// Convert keys to  compound key
	compositeKey, _ := stub.CreateCompositeKey(objectType, keys)

	// Add Party JSON to state
	err = stub.PutState(compositeKey, objectData)
	if err != nil {
		fmt.Println("ReplaceObject() : Error replacing Object in State Database %s", err)
		return err
	}

	fmt.Println("ReplaceObject() : - end init object ", objectType)
	return nil
}

////////////////////////////////////////////////////////////////////////////
// Query a User Object by Object Name and Key
// This has to be a full key and should return only one unique object
////////////////////////////////////////////////////////////////////////////
func QueryObject(stub shim.ChaincodeStubInterface, objectType string, keys []string) ([]byte, error) {

        // Check how many keys

        err := VerifyAtLeastOneKeyIsPresent(objectType, keys )
        if err != nil {
                return nil, err
        }

        compoundKey, _ := stub.CreateCompositeKey(objectType, keys)
        fmt.Println("QueryObject() : Compound Key : ", compoundKey)

        Avalbytes, err := stub.GetState(compoundKey)
        if err != nil {
                return nil, err
        }

        return Avalbytes, nil
}


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Retrieve a list of Objects from the Query
// The function returns an iterator from which objects can be retrieved.
//      defer rs.Close()
//
//      // Iterate through result set
//      var i int
//      for i = 0; rs.HasNext(); i++ {
//
//              // We can process whichever return value is of interest
//              myKey , myKeyVal , err := rs.Next()
//              if err != nil {
//                      return shim.Success(nil)
//              }
//              bob, _ := JSONtoUser(myKeyVal)
//              fmt.Println("GetList() : my Value : ", bob)
//      }
//
// eg: Args":["fetchlist", "PARTY","CHK"]}
// fetchList is the function that calls getList : ObjectType = "Party" and key is "CHK"
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
func GetList(stub shim.ChaincodeStubInterface, objectType string, keys []string) (shim.StateQueryIteratorInterface , error) {

	// Check how many keys

	err := VerifyAtLeastOneKeyIsPresent(objectType, keys )
        if err != nil {
                return nil, err
        }

	// Get Result set

        resultIter, err := stub.GetStateByPartialCompositeKey(objectType, keys)
	//resultIter, err := stub.PartialCompositeKeyQuery(objectType, keys)
        fmt.Println("GetList(): Retrieving Objects into an array")
        if err != nil {
                return nil, err
        }

	// Return iterator for result set
	// Use code above to retrieve objects
        return resultIter, nil
}

////////////////////////////////////////////////////////////////////////////
// This function verifies if the number of key provided is at least 1 and
// < the the max keys defined for the Object
////////////////////////////////////////////////////////////////////////////

func VerifyAtLeastOneKeyIsPresent(objectType string, args []string) error {

        // Check how many keys
        nKeys := GetNumberOfKeys(objectType)
        nCol := len(args)
	if nCol == 1 {
		return nil
	}

        if nCol < 1 {
		error_str :=  fmt.Sprintf("VerifyAtLeastOneKeyIsPresent() Failed: Atleast 1 Key must is needed :  nKeys : %s, nCol : %s ", nKeys, nCol)
                fmt.Println(error_str)
                return errors.New(error_str)
        }

        return nil
}
