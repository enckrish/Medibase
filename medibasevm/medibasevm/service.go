// (c) 2019-2020, Ava Labs, Inc. All rights reserved.
// See the file LICENSE for licensing terms.

package medibasevm

import (
	"errors"
	"fmt"
	"io/ioutil"
	"net/http"
	"strconv"
	"strings"

	"github.com/ava-labs/avalanchego/ids"
	"github.com/ava-labs/avalanchego/utils/formatting"
	"github.com/ava-labs/avalanchego/utils/json"
)

var (
	errBadData             = errors.New("bad data")
	errNoSuchBlock         = errors.New("couldn't get block from database. Does it exist?")
	errPayIDZero           = errors.New("PayID cannot be zero")
	errInvalidPayID        = errors.New("PayID doesn't exist")
	Admin_IP        string = "localhost:3001"
)

// Service is the API service for this VM
type Service struct{ vm *VM }

type AddValidatorArgs struct {
	NodeID  string `json:"nodeID"`
	PayAddr string `json:"payAddr"`
}

type AddValidatorReply struct {
	success bool
}

func (s *Service) AddValidator(_ *http.Request, args *AddValidatorArgs, reply *AddValidatorReply) error {
	resp, err := http.Get("http://" + Admin_IP + "/api/add_validator/" + args.NodeID + "/cchain/" + args.PayAddr)
	if err != nil {
		return err
	}

	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return err
	}

	sb := string(body)
	if strings.Contains(sb, "true") {
		reply.success = true
	} else {
		reply.success = false
	}
	return nil
}

type SetAdminIPArgs struct {
	IP   string `json:"ip"`
	Port string `json:"port"`
}

type SetAdminIPReply struct {
	success bool
}

func (s *Service) SetAdminIP(_ *http.Request, args *SetAdminIPArgs, reply *SetAdminIPReply) error {
	Admin_IP = args.IP + args.Port
	reply.success = true
	return nil
}

// ProposeBlockArgs are the arguments to function ProposeValue
type ProposeBlockArgs struct {
	// Data in the block. Must be base 58 encoding of 64 bytes.
	PayID string `json:"payID"`
	CID   string `json:"cid"`
}

// ProposeBlockReply is the reply from function ProposeBlock
type ProposeBlockReply struct{ Success bool }

// ProposeBlock is an API method to propose a new block whose data is [args].Data.
// [args].Data must be a string repr. of a 32 byte array
func (s *Service) ProposeBlock(_ *http.Request, args *ProposeBlockArgs, reply *ProposeBlockReply) error {
	// bytes, err := formatting.Decode(formatting.CB58, args.Data)
	payID := args.PayID
	cidStr := args.CID

	if payID == strconv.Itoa(0) {
		return errPayIDZero
	}

	var cid [64]byte
	copy(cid[:], []byte(cidStr))

	resp, err := http.Get("http://" + Admin_IP + "/api/useup_id/" + payID)
	if err != nil {
		return err
	}

	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return err
	}

	sb := string(body)
	if strings.Contains(sb, "true") {
		s.vm.proposeBlock(payID, cid)
		reply.Success = true
		return nil
	} else {
		reply.Success = false
		return errInvalidPayID
	}

}

// APIBlock is the API representation of a block
type APIBlock struct {
	Timestamp json.Uint64 `json:"timestamp"` // Timestamp of most recent block
	PayID     string      `json:"payId"`
	CID       string      `json:"cid"`      // Data in the most recent block. Base 58 repr. of 5 bytes.
	ID        string      `json:"id"`       // String repr. of ID of the most recent block
	ParentID  string      `json:"parentID"` // String repr. of ID of the most recent block's parent
}

// GetBlockArgs are the arguments to GetBlock
type GetBlockArgs struct {
	// ID of the block we're getting.
	// If left blank, gets the latest block
	ID string
}

// GetBlockReply is the reply from GetBlock
type GetBlockReply struct {
	APIBlock
}

// GetBlock gets the block whose ID is [args.ID]
// If [args.ID] is empty, get the latest block
func (s *Service) GetBlock(_ *http.Request, args *GetBlockArgs, reply *GetBlockReply) error {
	// If an ID is given, parse its string representation to an ids.ID
	// If no ID is given, ID becomes the ID of last accepted block
	var id ids.ID
	var err error
	if args.ID == "" {
		id, err = s.vm.LastAccepted()
		if err != nil {
			return fmt.Errorf("problem finding the last accepted ID: %s", err)
		}
	} else {
		id, err = ids.FromString(args.ID)
		if err != nil {
			return errors.New("problem parsing ID")
		}
	}

	// Get the block from the database
	blockInterface, err := s.vm.GetBlock(id)
	if err != nil {
		return errNoSuchBlock
	}

	block, ok := blockInterface.(*Block)
	if !ok { // Should never happen but better to check than to panic
		return errBadData
	}

	// Fill out the response with the block's data
	reply.APIBlock.ID = block.ID().String()
	reply.APIBlock.Timestamp = json.Uint64(block.Timestamp)
	reply.APIBlock.ParentID = block.Parent().String()
	reply.CID, err = formatting.EncodeWithChecksum(formatting.CB58, block.CID[:])
	reply.APIBlock.PayID = block.PayID

	return err
}
